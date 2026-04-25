/* Pulse Earth — 3D globe with Three.js
 * Procedural dotted Earth (no external textures), pulse meteors + ripple rings.
 */
(function (g) {
  "use strict";

  const Globe = {
    el: null, scene: null, camera: null, renderer: null,
    earth: null, dots: null, root: null,
    pulses: [],
    autoSpin: 0.00008,
    paused: false,
    _lastT: 0,

    init(canvas) {
      this.el = canvas;
      const w = canvas.clientWidth || innerWidth;
      const h = canvas.clientHeight || innerHeight;

      this.scene = new THREE.Scene();
      this.scene.fog = new THREE.FogExp2(0x000814, 0.018);

      this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
      this.camera.position.set(0, 0, 18);

      this.renderer = new THREE.WebGLRenderer({
        canvas, antialias: true, alpha: true, powerPreference: "high-performance"
      });
      this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
      this.renderer.setSize(w, h, false);
      this.renderer.setClearColor(0x000000, 0);

      const amb = new THREE.AmbientLight(0x9bb6ff, 0.35);
      const key = new THREE.DirectionalLight(0xffffff, 0.9);
      key.position.set(5, 4, 5);
      this.scene.add(amb, key);

      // halo
      const haloGeo = new THREE.SphereGeometry(7.6, 64, 64);
      const haloMat = new THREE.ShaderMaterial({
        transparent: true, side: THREE.BackSide, depthWrite: false,
        uniforms: { c: { value: new THREE.Color(0x5ae0e0) }, p: { value: 4.5 } },
        vertexShader: "varying vec3 vN;void main(){vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
        fragmentShader: "uniform vec3 c;uniform float p;varying vec3 vN;void main(){float a=pow(0.65-dot(vN,vec3(0,0,1.0)),p);gl_FragColor=vec4(c,a*0.85);}"
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);

      const earthGeo = new THREE.SphereGeometry(7, 64, 64);
      const earthMat = new THREE.MeshPhongMaterial({
        color: 0x05182f, emissive: 0x07112a, shininess: 20,
        specular: 0x123456, transparent: true, opacity: 0.95
      });
      this.earth = new THREE.Mesh(earthGeo, earthMat);

      this._buildDots();

      this.root = new THREE.Group();
      this.root.add(this.earth);
      this.root.add(this.dots);
      this.scene.add(halo);
      this.scene.add(this.root);

      this.root.rotation.x = -0.32;
      this.root.rotation.y = -1.2;

      this._bindControls();
      addEventListener("resize", () => this._resize());

      this._lastT = performance.now();
      this._loop = this._loop.bind(this);
      requestAnimationFrame(this._loop);
    },

    _resize() {
      const w = this.el.clientWidth || innerWidth;
      const h = this.el.clientHeight || innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h, false);
    },

    _buildDots() {
      const N = 9000;
      const positions = [];
      const colors = [];
      const colA = new THREE.Color(0x5ae0e0);
      const colB = new THREE.Color(0xb58cff);

      for (let i = 0; i < N; i++) {
        const t = i / N;
        const phi = Math.acos(1 - 2 * t);
        const theta = Math.PI * (1 + Math.sqrt(5)) * i;
        const sinPhi = Math.sin(phi);
        const x = sinPhi * Math.cos(theta);
        const y = Math.cos(phi);
        const z = sinPhi * Math.sin(theta);
        const lat = 90 - (phi * 180 / Math.PI);
        const lon = ((theta * 180 / Math.PI) % 360 + 540) % 360 - 180;

        if (!isLand(lat, lon)) continue;

        const r = 7.04;
        positions.push(x * r, y * r, z * r);
        const mix = 0.5 + 0.5 * Math.sin(lat * 0.06 + lon * 0.02);
        const c = colA.clone().lerp(colB, mix);
        colors.push(c.r, c.g, c.b);
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

      const mat = new THREE.PointsMaterial({
        size: 0.075, vertexColors: true, transparent: true, opacity: 0.95,
        depthWrite: false, sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        map: makeDotTexture()
      });
      this.dots = new THREE.Points(geo, mat);
    },

    _bindControls() {
      const el = this.el;
      let down = false, lx = 0, ly = 0;
      el.addEventListener("pointerdown", (e) => {
        down = true; lx = e.clientX; ly = e.clientY;
        try { el.setPointerCapture(e.pointerId); } catch (err) {}
      });
      el.addEventListener("pointerup", (e) => {
        down = false;
        try { el.releasePointerCapture(e.pointerId); } catch (err) {}
      });
      el.addEventListener("pointercancel", () => { down = false; });
      el.addEventListener("pointermove", (e) => {
        if (!down) return;
        const dx = (e.clientX - lx) * 0.005;
        const dy = (e.clientY - ly) * 0.005;
        this.root.rotation.y += dx;
        this.root.rotation.x = U.clamp(this.root.rotation.x + dy, -1.2, 1.2);
        lx = e.clientX; ly = e.clientY;
      });
      el.addEventListener("wheel", (e) => {
        e.preventDefault();
        this.camera.position.z = U.clamp(this.camera.position.z + e.deltaY * 0.01, 11, 28);
      }, { passive: false });

      let pinchStart = 0, startZ = 0;
      el.addEventListener("touchstart", (e) => {
        if (e.touches.length === 2) {
          pinchStart = touchDist(e); startZ = this.camera.position.z;
        }
      });
      el.addEventListener("touchmove", (e) => {
        if (e.touches.length === 2 && pinchStart) {
          const d = touchDist(e);
          this.camera.position.z = U.clamp(startZ * (pinchStart / d), 11, 28);
        }
      }, { passive: true });
      function touchDist(e) {
        const a = e.touches[0], b = e.touches[1];
        return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      }
    },

    spawnPulse(lat, lon, color, opts) {
      opts = opts || {};
      const r = 7.05;
      const pos = U.latLonToVec3(lat, lon, r);
      const v = new THREE.Vector3(pos.x, pos.y, pos.z);
      const col = new THREE.Color(color);

      const dotMat = new THREE.SpriteMaterial({
        map: makeDotTexture(),
        color: col,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false
      });
      const sprite = new THREE.Sprite(dotMat);
      sprite.scale.set(0.6, 0.6, 0.6);
      sprite.position.copy(v);

      const ringGeo = new THREE.RingGeometry(0.05, 0.07, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: col, transparent: true, opacity: 0.9,
        side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(v);
      const outward = v.clone().normalize();
      ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), outward);

      const beamGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.6, 12, 1, true);
      const beamMat = new THREE.MeshBasicMaterial({
        color: col, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.copy(v.clone().add(outward.clone().multiplyScalar(0.3)));
      beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), outward);

      this.root.add(sprite); this.root.add(ring); this.root.add(beam);

      this.pulses.push({
        sprite: sprite, ring: ring, beam: beam,
        ttl: opts.ttl || 2200,
        born: performance.now(),
        big: !!opts.big
      });
    },

    _loop(now) {
      const dt = now - this._lastT; this._lastT = now;

      if (!this.paused) this.root.rotation.y += this.autoSpin * dt;

      for (let i = this.pulses.length - 1; i >= 0; i--) {
        const p = this.pulses[i];
        const age = now - p.born;
        const k = age / p.ttl;
        if (k >= 1) {
          this.root.remove(p.sprite); this.root.remove(p.ring); this.root.remove(p.beam);
          try { p.sprite.material.dispose(); p.ring.material.dispose(); p.beam.material.dispose(); } catch (e) {}
          try { p.ring.geometry.dispose(); p.beam.geometry.dispose(); } catch (e) {}
          this.pulses.splice(i, 1);
          continue;
        }
        const s = p.big ? 1.6 : 1.0;
        const sc = (1 - k) * 0.7 * s + 0.3;
        p.sprite.scale.setScalar(sc);
        p.sprite.material.opacity = 1 - k;

        const ringScale = 1 + k * (p.big ? 22 : 14);
        p.ring.scale.setScalar(ringScale);
        p.ring.material.opacity = (1 - k) * 0.9;

        const beamH = 0.6 + k * (p.big ? 1.8 : 1.0);
        p.beam.scale.set(1, beamH, 1);
        p.beam.material.opacity = (1 - k) * 0.7;
      }

      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(this._loop);
    },

    setPaused(v) { this.paused = !!v; }
  };

  // ---- procedural land mask ----
  function isLand(lat, lon) {
    var phi = lat, lam = lon;
    if (phi < -62) return Math.random() < 0.7;
    if (inBox(phi, lam, 60, 84, -73, -12)) return ellipseGuard(phi, lam, 75, -42, 9, 18, 0.85);
    if (inBox(phi, lam, 14, 72, -168, -52)) {
      if (inBox(phi, lam, 18, 30, -98, -80)) return Math.random() < 0.05;
      if (inBox(phi, lam, 8, 24, -88, -60)) return Math.random() < 0.18;
      return ellipseGuard(phi, lam, 50, -100, 22, 36, 0.78);
    }
    if (inBox(phi, lam, -55, 13, -82, -34)) return ellipseGuard(phi, lam, -20, -60, 35, 18, 0.78);
    if (inBox(phi, lam, 36, 71, -10, 60)) {
      if (inBox(phi, lam, 30, 45, -5, 40)) return Math.random() < 0.55;
      return ellipseGuard(phi, lam, 54, 18, 18, 30, 0.8);
    }
    if (inBox(phi, lam, -35, 37, -18, 52)) return ellipseGuard(phi, lam, 2, 18, 36, 22, 0.8);
    if (inBox(phi, lam, 12, 42, 35, 65))   return ellipseGuard(phi, lam, 27, 50, 16, 16, 0.7);
    if (inBox(phi, lam, 42, 78, 25, 180))  return ellipseGuard(phi, lam, 60, 100, 20, 70, 0.78);
    if (inBox(phi, lam, -12, 55, 65, 145)) return ellipseGuard(phi, lam, 25, 100, 32, 30, 0.72);
    if (inBox(phi, lam, 30, 46, 128, 146)) return Math.random() < 0.65;
    if (inBox(phi, lam, -11, 20, 95, 140)) return Math.random() < 0.35;
    if (inBox(phi, lam, -40, -10, 112, 154))return ellipseGuard(phi, lam, -25, 134, 13, 20, 0.85);
    if (inBox(phi, lam, -47, -34, 165, 179))return Math.random() < 0.5;
    if (inBox(phi, lam, 49, 60, -11, 2))    return Math.random() < 0.6;
    if (inBox(phi, lam, -26, -12, 43, 51))  return Math.random() < 0.6;
    return false;
  }
  function inBox(p, l, p0, p1, l0, l1) { return p >= p0 && p <= p1 && l >= l0 && l <= l1; }
  function ellipseGuard(p, l, cp, cl, rp, rl, density) {
    var dx = (l - cl) / rl; var dy = (p - cp) / rp;
    var d = dx*dx + dy*dy;
    if (d > 1.05) return false;
    var noise = 0.85 - d * 0.45;
    return Math.random() < density * noise + 0.05;
  }

  var _dotTex = null;
  function makeDotTexture() {
    if (_dotTex) return _dotTex;
    var size = 64;
    var c = document.createElement("canvas");
    c.width = c.height = size;
    var ctx = c.getContext("2d");
    var grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.4, "rgba(255,255,255,0.55)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    _dotTex = new THREE.CanvasTexture(c);
    _dotTex.minFilter = THREE.LinearFilter;
    return _dotTex;
  }

  g.Globe = Globe;
})(window);
