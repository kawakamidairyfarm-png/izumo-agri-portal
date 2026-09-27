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
