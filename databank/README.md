# 川上牧場 酪農データバンク

川上牧場の音声配信（Pody / stand.fm）の文字起こしをもとに、酪農を志す人と牛乳を飲む人が同じ一次情報から学べるようにした静的サイトです。

- 全配信の索引（配信日・タイトル・分類・テーマ・シリーズ）を検索・絞り込み
- 本文を読み込んだ回には、要約・要点・Q&A・引用・実体験・注意点と全文を掲載
- 「学びの道筋」として、テーマごとに読む順番を用意
- 学ぶ人向け／飲む人向けの2つの入口

サーバー不要の完全静的サイトなので、GitHub Pages・Cloudflare Pages・Vercel・Netlify いずれの無料枠でも動きます。

## 構成

```
databank/
  data/
    episodes.json        全配信の索引（scripts/build_index.py が生成）
    articles/*.json      要約つきの回（1回1ファイル）
    transcripts/*.txt    要約つきの回の全文
  scripts/build_index.py  ローカルの文字起こしフォルダから data/ を更新するスクリプト
  src/
    lib/data.ts          索引・記事・全文の読み込み、分類ルール、テーマ・シリーズ判定
    lib/search.ts        全文検索（文字起こしの誤変換を吸収）
    lib/paths.ts         学びの道筋（読む順番）の定義
    pages/               画面（トップ、入口、道筋、一覧、配信詳細、このサイトについて）
```

## 開発

```bash
cd databank
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/ に静的ファイルを出力
```

## データの更新

### 1. 索引を更新する（新しい配信を追加したとき）

Windows のローカルフォルダ（`音声配信_NotebookLM用`）を指定して実行します。サブフォルダも再帰的に読みます。

```bash
python scripts/build_index.py --src "C:\Users\kawak\Documents\音声配信_NotebookLM用"
```

Google スプレッドシート「川上牧場_音声配信ソース台帳」の「ソース台帳」シートを CSV でダウンロードして渡すと、Drive のファイルIDも引き当てます。

```bash
python scripts/build_index.py --src <フォルダ> --ledger ソース台帳.csv
```

### 2. 要約を増やす（Claude API）

要約がまだ無い回を、新しい順に N 本まとめて要約し、`data/articles` と `data/transcripts` に追加します。

```bash
pip install anthropic
set ANTHROPIC_API_KEY=sk-ant-...     # PowerShell は $env:ANTHROPIC_API_KEY="..."
python scripts/build_index.py --src <フォルダ> --summarize 20
```

生成された JSON は人が読んで直せる形なので、公開前に一読して必要なら手で修正してください。特に `caveats`（読むときの注意）は残す価値があります。

### 3. 学びの道筋を編集する

`src/lib/paths.ts` の `PATHS` に、記事IDと「なぜこの順で読むか」を並べるだけです。

## 分類ルール

タイトルから機械的に付与しています（`src/lib/data.ts`）。

- 分類: 研修生教育 → 日常配信雑談 → ビジョン社会提言 の順に正規表現で判定し、どれにも当たらなければ 酪農技術管理
- テーマ: 牛乳・乳製品 / 牛の体と行動 / 繁殖・子牛 / 飼料・栄養 / 乳房炎・健康 / 経営・お金 / 就農・キャリア / 環境・堆肥 / AI・DX・発信 / 社会・制度・歴史 / 消費者との対話
- シリーズ: R7年研修生と配信 / 川上牧場研修（2021） / 日曜コメント返し / Famars Voices / 中高生の受け入れ

要約つきの回は、記事 JSON の `category` と `audience` が優先されます。

## 公開

`npm run build` の出力 `dist/` をそのままホスティングに置きます。ルーティングはハッシュ方式（`/#/browse`）なので、サーバー側の設定は不要です。

GitHub Pages に置く場合の例:

```bash
npm run build
# dist/ の中身を gh-pages ブランチ、または docs/ に配置
```

## 読むときの約束（サイト内「このサイトについて」と同じ）

- 配信は川上牧場の経験・問題意識として扱い、医学・栄養・制度の事実は最新の一次資料で確認する
- 価格・制度・製品仕様は配信日時点のもの
- 逐語引用は配信本体で確認する
