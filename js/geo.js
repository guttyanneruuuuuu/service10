/* Pulse Earth — privacy-respecting geo helper. */
(function (g) {
  "use strict";
  const C = g.PULSE_CONFIG;

  const TZ_MAP = {
    "Asia/Tokyo":              [35.6762, 139.6503, "Japan"],
    "Asia/Seoul":              [37.5665, 126.9780, "South Korea"],
    "Asia/Shanghai":           [31.2304, 121.4737, "China"],
    "Asia/Hong_Kong":          [22.3193, 114.1694, "Hong Kong"],
    "Asia/Taipei":             [25.0330, 121.5654, "Taiwan"],
    "Asia/Singapore":          [1.3521,  103.8198, "Singapore"],
    "Asia/Bangkok":            [13.7563, 100.5018, "Thailand"],
    "Asia/Jakarta":            [-6.2088, 106.8456, "Indonesia"],
    "Asia/Manila":             [14.5995, 120.9842, "Philippines"],
    "Asia/Ho_Chi_Minh":        [10.7626, 106.6602, "Vietnam"],
    "Asia/Kolkata":            [19.0760, 72.8777,  "India"],
    "Asia/Dubai":              [25.2048, 55.2708,  "UAE"],
    "Asia/Karachi":            [24.8607, 67.0011,  "Pakistan"],
    "Asia/Tehran":             [35.6892, 51.3890,  "Iran"],
    "Asia/Riyadh":             [24.7136, 46.6753,  "Saudi Arabia"],
    "Europe/Istanbul":         [41.0082, 28.9784,  "Turkey"],
    "Europe/Moscow":           [55.7558, 37.6173,  "Russia"],
    "Europe/London":           [51.5074, -0.1278,  "United Kingdom"],
    "Europe/Paris":            [48.8566, 2.3522,   "France"],
    "Europe/Berlin":           [52.5200, 13.4050,  "Germany"],
    "Europe/Madrid":           [40.4168, -3.7038,  "Spain"],
    "Europe/Rome":             [41.9028, 12.4964,  "Italy"],
    "Europe/Amsterdam":        [52.3676, 4.9041,   "Netherlands"],
    "Europe/Stockholm":        [59.3293, 18.0686,  "Sweden"],
    "Europe/Helsinki":         [60.1699, 24.9384,  "Finland"],
    "Europe/Warsaw":           [52.2297, 21.0122,  "Poland"],
    "Europe/Athens":           [37.9838, 23.7275,  "Greece"],
    "Europe/Lisbon":           [38.7223, -9.1393,  "Portugal"],
    "Africa/Cairo":            [30.0444, 31.2357,  "Egypt"],
    "Africa/Lagos":            [6.5244,  3.3792,   "Nigeria"],
    "Africa/Nairobi":          [-1.2921, 36.8219,  "Kenya"],
    "Africa/Johannesburg":     [-26.2041, 28.0473, "South Africa"],
    "Africa/Casablanca":       [33.5731, -7.5898,  "Morocco"],
    "America/New_York":        [40.7128, -74.0060, "United States (East)"],
    "America/Chicago":         [41.8781, -87.6298, "United States (Central)"],
    "America/Denver":          [39.7392, -104.9903,"United States (Mountain)"],
    "America/Los_Angeles":     [34.0522, -118.2437,"United States (West)"],
    "America/Toronto":         [43.6532, -79.3832, "Canada"],
    "America/Vancouver":       [49.2827, -123.1207,"Canada (West)"],
    "America/Mexico_City":     [19.4326, -99.1332, "Mexico"],
    "America/Sao_Paulo":       [-23.5505, -46.6333,"Brazil"],
    "America/Argentina/Buenos_Aires": [-34.6037, -58.3816, "Argentina"],
    "America/Lima":            [-12.0464, -77.0428, "Peru"],
    "America/Bogota":          [4.7110,  -74.0721, "Colombia"],
    "America/Santiago":        [-33.4489, -70.6693,"Chile"],
    "Australia/Sydney":        [-33.8688, 151.2093,"Australia (East)"],
    "Australia/Perth":         [-31.9505, 115.8605,"Australia (West)"],
    "Pacific/Auckland":        [-36.8485, 174.7633,"New Zealand"],
    "Pacific/Honolulu":        [21.3069, -157.8583,"Hawaii"]
  };

  function fromTimezone() {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const hit = TZ_MAP[tz];
      if (hit) return { lat: hit[0], lon: hit[1], place: hit[2], source: "tz" };
    } catch {}
    const a = C.anchors[Math.floor(Math.random() * C.anchors.length)];
    return { lat: a[0], lon: a[1], place: a[2], source: "fallback" };
  }

  const Geo = {
    cached: null,

    async resolve({ allowPrompt = false } = {}) {
      if (Geo.cached) return Geo.cached;

      const stored = localStorage.getItem("pulse:geo");
      if (stored) {
        try {
          const j = JSON.parse(stored);
          if (Date.now() - j.t < 24 * 3600 * 1000) {
            Geo.cached = j.v; return j.v;
          }
        } catch {}
      }

      const tz = fromTimezone();

      if (!allowPrompt || !navigator.geolocation) {
        Geo.cached = tz;
        try { localStorage.setItem("pulse:geo", JSON.stringify({ t: Date.now(), v: tz })); } catch {}
        return tz;
      }

      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            const { lat, lon } = U.coarseLatLon(latitude, longitude, 1);
            const v = { lat, lon, place: tz.place, source: "gps" };
            Geo.cached = v;
            try { localStorage.setItem("pulse:geo", JSON.stringify({ t: Date.now(), v })); } catch {}
            resolve(v);
          },
          () => {
            Geo.cached = tz;
            try { localStorage.setItem("pulse:geo", JSON.stringify({ t: Date.now(), v: tz })); } catch {}
            resolve(tz);
          },
          { enableHighAccuracy: false, maximumAge: 600000, timeout: 6000 }
        );
      });
    }
  };

  g.Geo = Geo;
})(window);
