/**
 * Pulse Earth — runtime config.
 * Leave firebase blank to run in zero-cost demo mode (synthetic feed).
 */
window.PULSE_CONFIG = Object.freeze({
  appName: "Pulse Earth",
  version: "1.0.0",
  firebase: {
    apiKey: "", authDomain: "", projectId: "", appId: "", measurementId: ""
  },
  limits: {
    msgMax: 80,
    cooldownMs: 8 * 1000,
    feedMax: 40,
    pulseTtlMs: 24 * 60 * 60 * 1000
  },
  flags: {
    syntheticFeed: true,
    syntheticRatePerMin: 30,
    showStreamBar: true
  },
  emotions: {
    joy:     { face: "😊", color: "#ffd166", label: "嬉しい",   sample: ["最高の朝!", "ありがとう", "今日いい日になりそう", "推しが尊い", "good vibes only"] },
    love:    { face: "😍", color: "#ff6b9a", label: "愛しい",   sample: ["大好き", "ずっと一緒に", "幸せ", "出会えてよかった", "i miss you"] },
    calm:    { face: "😌", color: "#5ae0e0", label: "穏やか",   sample: ["静かな夜", "コーヒーが沁みる", "今ここに集中", "深呼吸", "peaceful"] },
    sad:     { face: "😢", color: "#7aa6ff", label: "悲しい",   sample: ["寂しい", "なんで…", "泣きたい", "誰かに会いたい", "lonely tonight"] },
    angry:   { face: "😡", color: "#ff5a5a", label: "怒り",     sample: ["は?", "ふざけんな", "許せない", "もう無理", "wtf"] },
    anxious: { face: "😰", color: "#b58cff", label: "不安",     sample: ["明日大丈夫かな", "心がザワザワする", "眠れない", "誰か側にいて", "nervous"] },
    tired:   { face: "😴", color: "#9aa1b2", label: "疲れた",   sample: ["もう寝たい", "今日疲れた", "限界", "頑張った", "sleepy"] },
    wow:     { face: "🤯", color: "#ff9a3c", label: "びっくり", sample: ["まじか", "嘘でしょ", "信じられない", "最高すぎ", "no way"] }
  },
  anchors: [
    [35.6762, 139.6503, "Tokyo, JP"],
    [34.6937, 135.5023, "Osaka, JP"],
    [37.5665, 126.9780, "Seoul, KR"],
    [22.3193, 114.1694, "Hong Kong"],
    [1.3521,  103.8198, "Singapore"],
    [13.7563, 100.5018, "Bangkok, TH"],
    [19.0760, 72.8777,  "Mumbai, IN"],
    [25.2048, 55.2708,  "Dubai, AE"],
    [41.0082, 28.9784,  "Istanbul, TR"],
    [55.7558, 37.6173,  "Moscow, RU"],
    [52.5200, 13.4050,  "Berlin, DE"],
    [48.8566, 2.3522,   "Paris, FR"],
    [51.5074, -0.1278,  "London, UK"],
    [40.4168, -3.7038,  "Madrid, ES"],
    [-1.2921, 36.8219,  "Nairobi, KE"],
    [-26.2041, 28.0473, "Johannesburg, ZA"],
    [-33.8688, 151.2093,"Sydney, AU"],
    [-37.8136, 144.9631,"Melbourne, AU"],
    [-41.2865, 174.7762,"Wellington, NZ"],
    [-22.9068, -43.1729,"Rio de Janeiro, BR"],
    [-23.5505, -46.6333,"Sao Paulo, BR"],
    [-34.6037, -58.3816,"Buenos Aires, AR"],
    [19.4326,  -99.1332,"Mexico City, MX"],
    [40.7128,  -74.0060,"New York, US"],
    [34.0522,  -118.2437,"Los Angeles, US"],
    [41.8781,  -87.6298, "Chicago, US"],
    [37.7749,  -122.4194,"San Francisco, US"],
    [49.2827,  -123.1207,"Vancouver, CA"],
    [43.6532,  -79.3832, "Toronto, CA"],
    [60.1699,  24.9384,  "Helsinki, FI"],
    [59.3293,  18.0686,  "Stockholm, SE"]
  ]
});
