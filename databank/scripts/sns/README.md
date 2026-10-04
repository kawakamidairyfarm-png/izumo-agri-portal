# 毎日のSNS自動投稿（データバンクの1日1問）

2026-10-04 から。データバンクの「届いた質問と答え」を毎日1問、19:07（日本時間）に各SNSへ投稿する。

## 流れ
1. 公開のたび（pages.yml）に `scripts/sns/pick.mjs` が今日の1問を選び、`sns/today.json` と、その質問のカード画像（`instagram/<id>/1〜3.png`）を公開する。
   - 選ぶ順: 直近3日の配信で答えた質問 → 今月の季節の話題（`data/sns-calendar.json`）→ 日付で決まる順番。投稿済みは選ばない。
2. 毎日19:07に `.github/workflows/sns-post.yml` が `scripts/sns/post.mjs` を動かし、オンにしたSNSへ投稿する。
3. 投稿したら `data/sns-posted.json` に記録し、公開を呼んで明日の1問を選び直す。

## SNSごとの形（各SNSの見せ方に合わせる）
| SNS | 形 | リンク |
|---|---|---|
| Instagram | 画像3枚のカルーセル（質問・答え・案内）＋文 | 本文のリンクは押せないので「プロフィールのリンクから」 |
| Facebook ページ | 文＋質問ページへのリンク | 押せる（utm_source=facebook） |
| Threads | 画像1枚＋短い文 | 押せる（utm_source=threads） |
| X | 本文（質問と答えの要約）＋返信にリンク | 本文にリンクを入れると表示が減るため返信に分ける（utm_source=x） |

文は配信の記事の要約だけで作る。新しい答え・数字・あおる言葉は足さない。

## 動かし方（GitHub → Settings → Secrets and variables → Actions）
- **Variables**
  - `SNS_LIVE` … `on` で本番。`off` または未設定なら試運転（投稿せず、Actions の記録に文を出すだけ）。**止めたいときはここを off に。**
  - `SNS_INSTAGRAM` / `SNS_FACEBOOK` / `SNS_THREADS` / `SNS_X` … 投稿したいSNSだけ `on`。
- **Secrets**（値はリポジトリに書かない）
  - Instagram・Facebook: `META_PAGE_TOKEN`（Facebookページのアクセストークン・期限なしのもの）、`IG_USER_ID`、`FB_PAGE_ID`
  - Threads: `THREADS_TOKEN`、`THREADS_USER_ID`（トークンは60日で切れる。切れたら作り直す）
  - X: `X_API_KEY`、`X_API_SECRET`、`X_ACCESS_TOKEN`、`X_ACCESS_SECRET`（投稿できる権限 Read and Write のもの）

## 自動にしないもの
- YouTube ショート・TikTok: API から投稿すると、審査を通るまで非公開になるため。毎日のタスクで作り、本人が投稿する。
- LINE: 友だち全員への配信は無料の通数を使い切るため。週1のまとめを本人が送る。
- note: 公式の投稿APIが無い。

## 毎日のSNSルーティンとの重なり
Instagram を自動にしたら、日次セット（kawakami-sns-daily）の「Instagram 質問カード」は外す（同じ質問カードを二度出さないため）。

## 記録
- 2026-10-04: Meta のアプリ「川上牧場 SNS自動投稿」（開発モード）で Facebook ページ「川上牧場」のページの鍵（期限なし・6つの権限）を作り、Secrets（META_PAGE_TOKEN・IG_USER_ID・FB_PAGE_ID）と Variables（SNS_INSTAGRAM・SNS_FACEBOOK＝on）に入れた。点検: Instagram「kawakamifarm」・Facebook「川上牧場」とも読めた。SNS_LIVE は未設定（本番前）。
- Meta の「データアクセスの期限」が約3か月（2027年1月初め）。12月中旬に鍵を作り直して META_PAGE_TOKEN を入れ替える。
