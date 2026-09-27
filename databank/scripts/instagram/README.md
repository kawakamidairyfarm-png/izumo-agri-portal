# Instagram「今日の質問と答え」カード

データバンクに載っている「届いた質問」から、Instagram の縦長投稿（1080×1350）を3枚1組で作る。

| 枚 | 中身 |
|---|---|
| 1 | 牧場に届いた質問（深緑の地） |
| 2 | 配信で答えたこと（要約・約140字）と、答えた配信の日付と題 |
| 3 | 「あなたの質問が、誰かの牛乳をもっとおいしくする。」とLINEへの案内 |

## 作り方

```
cd databank
npm run build                                   # dist/qa.json を作る（質問の一覧）
node scripts/instagram/make-cards.mjs --latest 5   # 新しい質問から5組
node scripts/instagram/make-cards.mjs --id 7c4dd6b9   # 1問を指定（/q/<id> の記号）
```

出力は `databank/instagram/out/<配信日>_<id>/` に `1.png` `2.png` `3.png` と `caption.txt`（投稿文）。この出力は git に入れない。

Claude に「今日の質問カードを作って」と頼めば、同じことをして画像と投稿文を渡す。

## 決めごと

- 答えは配信の記事の要約を短くしたものだけ。新しい答えや数字は足さない。
- `--latest` は、要約に川上さんの答えがはっきり入っている質問だけを選ぶ（前置きだけ・空のものは外す）。
- 色はサイトと同じ3色。英語・絵文字の飾りは入れない。
- 投稿文の最後にあるURL（`?utm_source=instagram` 付き）は、ストーリーズのリンクやプロフィールのリンクに使う。アクセスログで「instagram」として数えられる。

## 毎日のSNSルーティンとのつなぎ（2026-09-27）

- 公開（pages.yml）のたびに、新しい質問から7組を `dist/instagram/<id>/` に作り、次の2つを置く。
  - `https://kawakamidairyfarm-png.github.io/izumo-agri-portal/instagram/` … スマホで画像を長押し保存・投稿文をコピーできる一覧（検索には出さない）
  - `https://kawakamidairyfarm-png.github.io/izumo-agri-portal/instagram/cards.json` … ルーティンが読む一覧（id・質問・画像3枚のURL・投稿文）
- 配信の取り込み（ingest.yml・毎日12時）で新しい回が入ると公開が走るので、カードも自動で新しくなる。
- 毎日のSNSルーティン（アカウントのスキル kawakami-sns-daily）は cards.json から、メモリ `instagram-posted` に `質問カード: <id>` の無い最初の1組を選んで渡す。スキルの改訂版は `kawakami-sns-daily_SKILL.md`。
- 質問の形の文（？・ですか・ますか・でしょうか）で、答えの要約に川上さんの答えが入っているものだけを選ぶ。
