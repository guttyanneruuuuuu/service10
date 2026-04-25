/**
 * Pulse Earth — runtime config.
 *
 * Leave firebase blank to run in zero-cost demo mode (synthetic feed).
 * To enable real cross-device pulses:
 *   1) Create a Firebase project (free Spark plan)
 *   2) Enable Firestore (start in production mode)
 *   3) Paste your Web SDK config below
 *   4) Deploy `firestore.rules` from the repo root
 */
window.PULSE_CONFIG = Object.freeze({
  appName: "Pulse Earth",
  version: "1.0.0",

  firebase: {
    apiKey: "",
    authDomain: "",
    projectId: "",
    appId: "",
    measurementId: ""
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
    joy: {
      face: "😊", color: "#ffd166", label: "嬉しい",
      sample: [
        "今日は良いことがあった",
        "推しの新曲が最高すぎる",
        "テスト終わった!!!",
        "晴れた空が気持ちいい",
        "猫が膝の上で寝てる",
        "友達と笑い転げた",
        "コンビニのスイーツ当たり",
        "なんか今、最高",
        "推しが尊い",
        "通学路の桜きれい"
      ]
    },
    love: {
      face: "😍", color: "#ff6b9a", label: "愛しい",
      sample: [
        "好きな人と話せた",
        "母さんありがとう",
        "推しに会えた一生忘れない",
        "犬の寝顔が天使",
        "君に会いたい",
        "ライブ最高だった",
        "家族でご飯おいしかった",
        "推し活が生きがい",
        "ありがとう、世界"
      ]
    },
    calm: {
      face: "😌", color: "#5ae0e0", label: "穏やか",
      sample: [
        "夜風が気持ちいい",
        "紅茶を飲んでる",
        "音楽聴きながら散歩",
        "風呂上がりの一杯",
        "雨音が落ち着く",
        "海を見てる",
        "今日はゆっくりしよ",
        "深呼吸ひとつ"
      ]
    },
    sad: {
      face: "😢", color: "#7aa6ff", label: "悲しい",
      sample: [
        "なんか涙が出る",
        "別れちゃった",
        "推しの活動休止つらい",
        "おばあちゃんを思い出す",
        "受験落ちた",
        "誰にも言えない",
        "夜が長い",
        "ひとりだ"
      ]
    },
    angry: {
      face: "😡", color: "#ff5a5a", label: "怒り",
      sample: [
        "電車またトラブル",
        "理不尽すぎる",
        "なんなんだあいつ",
        "課題多すぎ",
        "怒りで眠れない",
        "もう嫌だ",
        "ありえない",
        "今日まじで運悪い"
      ]
    },
    anxious: {
      face: "😰", color: "#b58cff", label: "不安",
      sample: [
        "明日の発表こわい",
        "未来どうなるんだろう",
        "進路まよう",
        "返信こない",
        "また失敗したらどうしよう",
        "胸がざわざわする",
        "夜眠れない",
        "息が浅い"
      ]
    },
    tired: {
      face: "😴", color: "#9aa1b2", label: "疲れた",
      sample: [
        "もう寝たい",
        "今日も長かった",
        "電池切れ",
        "学校だるかった",
        "体が重い",
        "全部おやすみ",
        "おやすみ世界",
        "とりあえず布団"
      ]
    },
    wow: {
      face: "🤯", color: "#ff9a3c", label: "びっくり",
      sample: [
        "は!?マジで?",
        "信じられない展開",
        "世界どうなってんの",
        "ニュース見てびっくり",
        "今日エモすぎ",
        "嘘でしょ",
        "天才を見た",
        "鳥肌たった"
      ]
    }
  },

  /**
   * Anchor cities for the synthetic feed.
   * [lat, lon, "Place, CC"]
   */
  anchors: [
    [35.6762, 139.6503, "Tokyo, JP"],
    [34.6937, 135.5023, "Osaka, JP"],
    [35.0116, 135.7681, "Kyoto, JP"],
    [43.0618, 141.3545, "Sapporo, JP"],
    [33.5904, 130.4017, "Fukuoka, JP"],
    [37.5665, 126.9780, "Seoul, KR"],
    [31.2304, 121.4737, "Shanghai, CN"],
    [22.3193, 114.1694, "Hong Kong, HK"],
    [25.0330, 121.5654, "Taipei, TW"],
    [1.3521,  103.8198, "Singapore, SG"],
    [13.7563, 100.5018, "Bangkok, TH"],
    [-6.2088, 106.8456, "Jakarta, ID"],
    [28.6139, 77.2090,  "Delhi, IN"],
    [19.0760, 72.8777,  "Mumbai, IN"],
    [25.2048, 55.2708,  "Dubai, AE"],
    [41.0082, 28.9784,  "Istanbul, TR"],
    [55.7558, 37.6173,  "Moscow, RU"],
    [52.5200, 13.4050,  "Berlin, DE"],
    [48.8566, 2.3522,   "Paris, FR"],
    [51.5074, -0.1278,  "London, UK"],
    [40.4168, -3.7038,  "Madrid, ES"],
    [41.9028, 12.4964,  "Rome, IT"],
    [59.3293, 18.0686,  "Stockholm, SE"],
    [40.7128, -74.0060, "New York, US"],
    [34.0522, -118.2437, "Los Angeles, US"],
    [37.7749, -122.4194, "San Francisco, US"],
    [41.8781, -87.6298, "Chicago, US"],
    [49.2827, -123.1207, "Vancouver, CA"],
    [43.6532, -79.3832, "Toronto, CA"],
    [19.4326, -99.1332, "Mexico City, MX"],
    [-23.5505, -46.6333, "São Paulo, BR"],
    [-34.6037, -58.3816, "Buenos Aires, AR"],
    [-33.4489, -70.6693, "Santiago, CL"],
    [-33.8688, 151.2093, "Sydney, AU"],
    [-37.8136, 144.9631, "Melbourne, AU"],
    [-36.8485, 174.7633, "Auckland, NZ"],
    [-26.2041, 28.0473, "Johannesburg, ZA"],
    [30.0444, 31.2357,  "Cairo, EG"],
    [6.5244,  3.3792,   "Lagos, NG"],
    [-1.2921, 36.8219,  "Nairobi, KE"]
  ]
});
