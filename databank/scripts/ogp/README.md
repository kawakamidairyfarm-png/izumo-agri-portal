# 共有画像（OGP）の型紙

- `ogp.html`: 1200×630 の型紙。サイトと同じ書体（Noto Sans JP／Noto Serif JP）と3色（深緑 #172a19・生成り #fdfbf6・干し草の黄 #f2cf7a）。`PHOTO` を写真の名前に置き換え、Chromium で 1200×630 のスクリーンショットを撮る。
- `logo.png`: 川上牧場のロゴ（背景を透明にしたもの）。生成りの札に載せる。
- `jersey.jpg`: 本命の写真（川上さん撮影・ジャージー牛の鼻先）。出来上がりは `public/ogp-<日付>.jpg`（画像を替えたら名前の日付も変え、index.html の og:image と twitter:image を書き換える。同じ名前のまま上書きすると、Discord などは古い画像を出し続ける）。
- `calf.jpg` / `ogp_calf.jpg`: 差し替え用（子牛）。`public/ogp-<日付>.jpg`（画像を替えたら名前の日付も変え、index.html の og:image と twitter:image を書き換える。同じ名前のまま上書きすると、Discord などは古い画像を出し続ける） に上書きすれば切り替わる。
- 写真を変えるときは `--pos: 56% 45%`（object-position）で顔の位置を合わせる。
- 決めごとは `../OGP_共有画像のプロンプト_2026-09-22.md`。
