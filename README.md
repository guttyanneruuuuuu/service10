# Mirror.world

> 世界で何人、あなたと同じ？  
> 登録不要・無料・3 分の自己分析サービス。

**Live**: https://guttyanneruuuuuu.github.io/service10/

---

## 何ができる？

- 24 問のシンプルな質問に答えるだけ
- 6 つの心理軸で「世界で何人があなたと同じ性格か」を計算
- 64 種類のタイトル（「夜空の予言者」「嵐を起こす自由人」など）
- 1200×630 のシェア用画像が自動生成（X / LINE / Instagram で映える）
- 完全クライアントサイド：あなたの回答はあなたの端末から外に出ない

## なぜ作ったか

「自分は世界でどれくらい珍しい存在か？」  
これは年齢を問わず誰の心にもある問いです。  
一方で世の中の MBTI / 性格診断は `16 タイプ` までで止まり、  
**自分が世界で何人いるか** という直感的な数字は出してくれません。

Mirror.world はそこを埋めます。  
6 軸 × 強度のジョイント確率で、**人類 80 億人の中での希少度**を 1 つの数字に変換します。

## 技術スタック

- Vanilla JS / HTML / CSS のみ（フレームワーク 0）
- localStorage / Canvas API
- データ: `data/questions.json`, `data/distribution.json`
- バックエンド・有料 API なし（GitHub Pages で完全動作）
- セキュリティ: CSP / X-Content-Type-Options / クリックジャッキング対策
- アナリティクス: 匿名カウンタ（IP・UA を保存しない）

## ローカルで動かす

```bash
git clone https://github.com/guttyanneruuuuuu/service10.git
cd service10
python3 -m http.server 8000
# → http://localhost:8000/
```

## ファイル構成

```
.
├─ index.html               # SPA エントリ
├─ 404.html
├─ manifest.webmanifest     # PWA
├─ robots.txt / sitemap.xml # SEO
├─ css/style.css
├─ js/
│  ├─ util.js               # 共通ユーティリティ
│  ├─ security.js           # クライアント側セキュリティ
│  ├─ analytics.js          # プライバシー優先の集計
│  ├─ store.js              # localStorage ラッパ
│  ├─ engine.js             # スコアリング / レアリティ計算
│  ├─ share.js              # 1200x630 シェア画像生成
│  ├─ views.js              # 画面描画
│  └─ app.js                # ルーティング & イベント
├─ data/
│  ├─ questions.json        # 24 問の質問セット
│  └─ distribution.json     # 統計モデル + 64 タイトル
└─ assets/                  # icon / og 画像
```

## 収益化ロードマップ（運用費 0 円のまま）

| 段階 | 施策 | 想定月額 |
|---|---|---|
| **A** | Mirror Pro：相性診断 / 友達との一致率（¥480/月） | 〜30 万円 |
| **B** | 結果カード PDF レポート販売（¥600/回） | 〜10 万円 |
| **C** | B2B：採用・チーム診断 API（¥30,000〜/月） | 〜200 万円 |
| **D** | スポンサー質問セット（ブランドコラボ） | 1 案件 50 万〜 |

## SNS 拡散

- X / Twitter：結果カードを画像付きで自動ツイート
- TikTok：「自分の希少度を当てるゲーム」フォーマット
- Instagram：ストーリーに結果カードを直接シェア

## ライセンス

MIT — 自由に fork して、自分の街の言語で立ち上げてください。

---

Built by a high-school student in Tokyo, 2026.
