/* Pulse Earth — Three.js globe with emotion drops. */
(function (g) {
  "use strict";
  const C = g.PULSE_CONFIG;

  // Continent outlines (rough closed loops [lon, lat]) — kept tiny on purpose.
  const CONTINENT_LOOPS = [
    [[-168,66],[-160,71],[-140,70],[-110,72],[-90,75],[-75,78],[-60,82],[-48,79],[-30,82],[-25,72],[-50,60],[-65,52],[-70,45],[-80,32],[-85,30],[-90,29],[-97,26],[-105,22],[-110,23],[-117,32],[-122,37],[-125,49],[-132,55],[-140,60],[-152,60],[-165,55],[-168,66]],
    [[-92,16],[-85,15],[-78,9],[-72,11],[-66,11],[-58,5],[-52,4],[-44,-2],[-39,-9],[-37,-11],[-39,-22],[-49,-25],[-55,-34],[-62,-39],[-67,-46],[-70,-54],[-74,-45],[-72,-35],[-75,-15],[-80,-5],[-79,4],[-83,8],[-88,15],[-92,16]],
    [[-10,36],[-5,43],[3,43],[10,40],[18,40],[30,40],[40,42],[55,40],[65,42],[75,40],[90,42],[100,38],[112,32],[120,28],[122,32],[127,42],[132,46],[140,52],[150,60],[160,68],[170,72],[180,72],[180,80],[140,80],[100,80],[70,80],[40,80],[10,72],[0,68],[5,60],[12,55],[15,52],[20,52],[25,55],[28,56],[30,60],[28,55],[20,48],[18,42],[12,40],[6,38],[-2,36],[-10,36]],
    [[-17,14],[-15,20],[-7,33],[10,32],[20,30],[30,30],[35,22],[40,12],[42,6],[40,-3],[36,-12],[32,-22],[25,-30],[18,-34],[12,-30],[8,-20],[5,-12],[-2,-2],[-10,4],[-15,8],[-17,14]],
    [[114,-22],[122,-18],[130,-12],[140,-12],[145,-15],[148,-20],[152,-25],[150,-32],[145,-38],[138,-37],[132,-32],[125,-32],[120,-34],[115,-34],[114,-22]],
    [[-50,82],[-22,82],[-12,76],[-22,68],[-40,60],[-52,68],[-55,75],[-50,82]]
  ];

  class Globe {
    constructor(canvas) {
      this.canvas = canvas;
      this.scene = new THREE.Scene();
      this.scene.background = null;

      const w = canvas.clientWidth || innerWidth;
      const h = canvas.clientHeight || innerHeight;
      this.camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
      this.camera.position.set(0, 0, 4.6);

      this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
      this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
      this.renderer.setSize(w, h, false);
      this.renderer.setClearColor(0x000000, 0);

      this.root = new THREE.Group();
      this.scene.add(this.root);
      this.globeGroup = new THREE.Group();
      this.root.add(this.globeGroup);

      this.R = 1.5;
      this.atmosphereR = 1.62;

      this._makeStars();
      this._makeGlobe();
      this._makeContinents();
      this._makeAtmosphere();

      this._auto = { x: 0.0008, y: 0 };
      this._rot = { x: 0.4, y: -0.6 };
      this._target = { x: this._rot.x, y: this._rot.y };
      this._dragging = false;
      this._lastP = null;
      this._zoom = 1.0;

      this._bindInputs();

      this.pulses = [];

      this._onResize = this._onResize.bind(this);
      window.addEventListener("resize", this._onResize);

      this._tick = this._tick.bind(this);
      this._lastT = performance.now();
      requestAnimationFrame(this._tick);
    }

    _makeStars() {
      const N = 1200;
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        const r = 30 + Math.random() * 30;
        const t = Math.random() * Math.PI * 2;
        const u = Math.random() * 2 - 1;
        const s = Math.sqrt(1 - u * u);
        pos[i*3]   = r * s * Math.cos(t);
        pos[i*3+1] = r * u;
        pos[i*3+2] = r * s * Math.sin(t);
      }
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.06, sizeAttenuation: true, transparent: true, opacity: 0.9 });
      this.scene.add(new THREE.Points(geo, mat));
    }

    _makeGlobe() {
      const geo = new THREE.SphereGeometry(this.R, 64, 48);
      const mat = new THREE.MeshBasicMaterial({ color: 0x0a1430 });
      const mesh = new THREE.Mesh(geo, mat);
      this.globeGroup.add(mesh);

      const gridMat = new THREE.LineBasicMaterial({ color: 0x1a2752, transparent: true, opacity: 0.55 });
      for (let lon = -180; lon < 180; lon += 30) {
        const pts = [];
        for (let lat = -90; lat <= 90; lat += 3) {
          const v = U.latLonToVec3(lat, lon, this.R * 1.001);
          pts.push(new THREE.Vector3(v.x, v.y, v.z));
        }
        const g = new THREE.BufferGeometry().setFromPoints(pts);
        this.globeGroup.add(new THREE.Line(g, gridMat));
      }
      for (let lat = -60; lat <= 60; lat += 30) {
        const pts = [];
        for (let lon = -180; lon <= 180; lon += 3) {
          const v = U.latLonToVec3(lat, lon, this.R * 1.001);
          pts.push(new THREE.Vector3(v.x, v.y, v.z));
        }
        const g = new THREE.BufferGeometry().setFromPoints(pts);
        this.globeGroup.add(new THREE.Line(g, gridMat));
      }
    }

    _makeContinents() {
      const mat = new THREE.LineBasicMaterial({ color: 0x4a6cff, transparent: true, opacity: 0.85 });
      const matGlow = new THREE.LineBasicMaterial({ color: 0x7fb2ff, transparent: true, opacity: 0.45 });

      for (const loop of CONTINENT_LOOPS) {
        const pts = [];
        for (const [lon, lat] of loop) {
          const v = U.latLonToVec3(lat, lon, this.R * 1.005);
          pts.push(new THREE.Vector3(v.x, v.y, v.z));
        }
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const line = new THREE.Line(geo, mat);
        const glow = new THREE.Line(geo, matGlow);
        glow.scale.setScalar(1.005);
        this.globeGroup.add(line);
        this.globeGroup.add(glow);
      }
    }

    _makeAtmosphere() {
      const geo = new THREE.SphereGeometry(this.atmosphereR, 64, 48);
      const mat = new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          uColor: { value: new THREE.Color(0x6fa8ff) },
          uPower: { value: 2.2 },
          uIntensity: { value: 0.9 }
        },
        vertexShader: [
          "varying vec3 vNormal;",
          "varying vec3 vPos;",
          "void main() {",
          "  vNormal = normalize(normalMatrix * normal);",
          "  vec4 mv = modelViewMatrix * vec4(position, 1.0);",
          "  vPos = mv.xyz;",
          "  gl_Position = projectionMatrix * mv;",
          "}"
        ].join("\n"),
        fragmentShader: [
          "varying vec3 vNormal;",
          "varying vec3 vPos;",
          "uniform vec3 uColor;",
          "uniform float uPower;",
          "uniform float uIntensity;",
          "void main() {",
          "  vec3 viewDir = normalize(-vPos);",
          "  float fres = pow(1.0 - max(dot(vNormal, viewDir), 0.0), uPower);",
          "  gl_FragColor = vec4(uColor, fres * uIntensity);",
          "}"
        ].join("\n")
      });
      this.atmo = new THREE.Mesh(geo, mat);
      this.globeGroup.add(this.atmo);
    }

    _bindInputs() {
      const c = this.canvas;
      const onDown = (x, y) => { this._dragging = true; this._lastP = { x, y }; };
      const onMove = (x, y) => {
        if (!this._dragging || !this._lastP) return;
        const dx = (x - this._lastP.x) / innerWidth;
        const dy = (y - this._lastP.y) / innerHeight;
        this._target.y += dx * 4;
        this._target.x = U.clamp(this._target.x + dy * 3, -1.2, 1.2);
        this._lastP = { x, y };
      };
      const onUp = () => { this._dragging = false; this._lastP = null; };

      c.addEventListener("mousedown", (e) => { e.preventDefault(); onDown(e.clientX, e.clientY); });
      window.addEventListener("mousemove", (e) => onMove(e.clientX, e.clientY));
      window.addEventListener("mouseup", onUp);
      c.addEventListener("touchstart", (e) => { if (e.touches[0]) onDown(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
      c.addEventListener("touchmove",  (e) => { if (e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
      c.addEventListener("touchend", onUp, { passive: true });

      c.addEventListener("wheel", (e) => {
        e.preventDefault();
        const d = Math.sign(e.deltaY);
        this._zoom = U.clamp(this._zoom + d * 0.06, 0.7, 1.6);
      }, { passive: false });
    }

    _onResize() {
      const w = this.canvas.clientWidth || innerWidth;
      const h = this.canvas.clientHeight || innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h, false);
    }

    addPulse({ lat, lon, color, big = false }) {
      const target = U.latLonToVec3(lat, lon, this.R);
      const dirN = new THREE.Vector3(target.x, target.y, target.z).normalize();

      const head = new THREE.Mesh(
        new THREE.SphereGeometry(big ? 0.04 : 0.025, 12, 12),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 })
      );
      const tailLen = big ? 0.6 : 0.4;
      const tailGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, tailLen)
      ]);
      const tailMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.7 });
      const tail = new THREE.Line(tailGeo, tailMat);
      const dropGroup = new THREE.Group();
      dropGroup.add(head);
      dropGroup.add(tail);
      const startDist = 1.6;
      const startPos = dirN.clone().multiplyScalar(this.R + startDist);
      dropGroup.position.copy(startPos);
      dropGroup.lookAt(0, 0, 0);
      this.globeGroup.add(dropGroup);

      const ringGeo = new THREE.RingGeometry(0.015, 0.022, 48);
      const ringMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(dirN).multiplyScalar(this.R * 1.005);
      ring.lookAt(dirN.clone().multiplyScalar(this.R * 2));
      this.globeGroup.add(ring);
      ring.visible = false;

      const pillarGeo = new THREE.BufferGeometry().setFromPoints([
        dirN.clone().multiplyScalar(this.R),
        dirN.clone().multiplyScalar(this.R + (big ? 0.55 : 0.35))
      ]);
      const pillarMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.0 });
      const pillar = new THREE.Line(pillarGeo, pillarMat);
      this.globeGroup.add(pillar);

      this.pulses.push({
        phase: "fall", t: 0,
        head, tail: tailMat, dropGroup,
        ring, ringMat,
        pillar, pillarMat,
        dirN, color: new THREE.Color(color), big
      });
    }

    _stepPulses(dt) {
      const remove = [];
      for (let i = 0; i < this.pulses.length; i++) {
        const p = this.pulses[i];
        if (p.phase === "fall") {
          p.t += dt;
          const dur = 0.7;
          const k = Math.min(1, p.t / dur);
          const ek = 1 - Math.pow(1 - k, 3);
          const dist = U.lerp(1.6, 0.0, ek);
          p.dropGroup.position.copy(p.dirN.clone().multiplyScalar(this.R + dist));
          p.dropGroup.lookAt(0, 0, 0);
          if (k >= 1) {
            this.globeGroup.remove(p.dropGroup);
            p.head.material.dispose(); p.head.geometry.dispose();
            p.ring.visible = true;
            p.phase = "ring"; p.t = 0;
          }
        } else if (p.phase === "ring") {
          p.t += dt;
          const dur = p.big ? 1.4 : 1.0;
          const k = Math.min(1, p.t / dur);
          const sc = U.lerp(1, p.big ? 8 : 5, k);
          p.ring.scale.setScalar(sc);
          p.ringMat.opacity = (1 - k) * 0.9;
          p.pillarMat.opacity = Math.sin(k * Math.PI) * (p.big ? 0.9 : 0.6);
          if (k >= 1) {
            this.globeGroup.remove(p.ring); this.globeGroup.remove(p.pillar);
            p.ring.geometry.dispose(); p.ringMat.dispose();
            p.pillar.geometry.dispose(); p.pillarMat.dispose();
            remove.push(i);
          }
        }
      }
      for (let j = remove.length - 1; j >= 0; j--) this.pulses.splice(remove[j], 1);
    }

    _tick(now) {
      const dt = Math.min(0.05, (now - this._lastT) / 1000);
      this._lastT = now;

      this._rot.x = U.lerp(this._rot.x, this._target.x, 0.12);
      this._rot.y = U.lerp(this._rot.y, this._target.y, 0.12);
      if (!this._dragging) this._target.y += this._auto.x;

      this.globeGroup.rotation.x = this._rot.x;
      this.globeGroup.rotation.y = this._rot.y;

      this.camera.position.z = U.lerp(this.camera.position.z, 4.6 / this._zoom, 0.1);

      this._stepPulses(dt);

      this.atmo.material.uniforms.uIntensity.value = 0.85 + Math.sin(now * 0.001) * 0.08;

      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(this._tick);
    }
  }

  g.PulseGlobe = Globe;
})(window);
