# 毎日のSNS自動投稿（データバンクの1日1問）

2026-10-04 から。データバンクの「届いた質問と答え」を毎日1問、日本時間 19:00〜21:00 のあいだに各SNSへ投稿する（19:07 から20分おきに呼び、最初に動いた回で投稿）。

## 流れ
1. 公開のたび（pages.yml）に `scripts/sns/pick.mjs` が今日の1問を選び、`sns/today.json` と、その質問のカード画像（`instagram/<id>/1〜3.png`）を公開する。
   - 選ぶ順: 直近3日の配信で答えた質問 → 今月の季節の話題（`data/sns-calendar.json`）→ 日付で決まる順番。投稿済みは選ばない。
2. 毎日 19:00〜21:00 に（20分おきの予約のうち最初に動いた回で） `.github/workflows/sns-post.yml` が `scripts/sns/post.mjs` を動かし、オンにしたSNSへ投稿する。
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
  - Threads: `THREADS_TOKEN`（60日で切れる。切れる前に作り直して入れ替える）。`THREADS_USER_ID` は点検で照合するだけ（投稿先は鍵の持ち主＝me）
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
- 2026-10-04 22:19: 本人が Variables に SNS_LIVE=on を追加（拡張機能で入力・文字コードで確認）。点検の記録で SNS_LIVE=on・SNS_INSTAGRAM=on・SNS_FACEBOOK=on を確認。**本番は 10/5 19:07 から**（Instagram と Facebook）。
- 2026-10-05 昼: Meta の同じアプリに「Threads API にアクセス」を追加（threads_basic・threads_content_publish）。@kawakamifarm をテスターに入れて本人が承認、長期の鍵を作って Secrets（THREADS_TOKEN・THREADS_USER_ID）に本人が入れた。
- 同日13:29の点検: 鍵は使えたが、ユーザーIDの数字で読むと「Object does not exist」で止まった。→ 投稿・点検とも、数字を使わず鍵の持ち主（me）を読む形に直した。
- Threads の鍵の延長（refresh）は、延ばすたびに別の文字列の鍵が返る＝延ばしても Secrets の鍵は延びない。そのため自動の延長はやめた。**鍵は 2026-10-05 作成・約60日＝12月4日ごろに切れる。11月末に作り直して THREADS_TOKEN を入れ替える**（12月中旬の META_PAGE_TOKEN の作り直しと近いので、11月末に両方まとめてもよい）。
- 2026-10-05 13:35: 本人が Variables に SNS_THREADS=on を追加。点検の記録で SNS_LIVE・SNS_INSTAGRAM・SNS_FACEBOOK・SNS_THREADS＝on、Threads「kawakamifarm」OK を確認。**Threads の本番は 10/5 19:07 から**（X は未設定）。
- 2026-10-05: 初日の 19:07 の予約が動かず、19:37 に手で投稿（Instagram・Facebook・Threads）。予備の時刻（19:37・20:17）と「同じSNSは1日1回」を足した。
- 2026-10-06 04:14: 前日 19:07 の予約が**約9時間遅れて**動き、日付が変わっていたため 10/6 の1問（90233afc）を朝4時に投稿してしまった。→ **投稿してよい時間帯を日本時間 18時〜23時に限った**（外で動いたら何もしない。変えるときは Variables の SNS_WINDOW、例 `18-23`）。予備の時刻を 20:47・21:27 にも足した。「1日1回」は「同じ日の夜の時間帯に1回」に改め、朝の誤投稿があった日も夜はふつうに出す。
- GitHub の時刻指定は遅れ・抜けがある（保証なし）。毎日きっちり 19:07 に出したいなら、外の予約サービス（cron-job.org など）から投稿の実行を呼ぶ形にする。
- 2026-10-06: 本人の指定「だいたい19:00〜21:00までに投稿できれば良い」→ 時間帯を 19〜21時に（SNS_WINDOW の既定 `19-21`）。予約は 18:47〜20:47 の20分おき7回。
