// Instagram の表紙のイラスト（2026-10-11・本人「Bで試しに」）。画像生成を使わず、図形を重ねた切り絵風の絵を描く。
// window.drawArt(kind) が 1080×620 の SVG 文字列を返す。kind は make-cards.mjs の illustFor() が質問の中身で選ぶ。
// 絵には文字・数字を入れない。色はサイトと同じ（深緑・生成り・干し草の黄）＋牛の白黒と牛乳の白。
;(function () {
  const C = { deep: '#172a19', moss: '#2f5232', mid: '#5e8a4f', leaf: '#8fb27a', pale: '#cfe0bf', sky: '#e8efdc', cream: '#fdfbf6', hay: '#f2cf7a', hay2: '#d9a948', pink: '#f2b8b5', black: '#1f1f1f', brown: '#b9763f', white: '#ffffff', milk: '#fbfbf7', wood: '#8a5a33' }
  const defs = `<defs>
    <filter id="ps" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="8" stdDeviation="7" flood-color="${C.deep}" flood-opacity=".20"/></filter>
    <filter id="ps2" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="${C.deep}" flood-opacity=".22"/></filter>
    <pattern id="paper" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="none"/><circle cx="1" cy="1" r=".6" fill="#000" opacity=".035"/></pattern>
  </defs>`
  const sky = (c = C.sky) => `<rect width="1080" height="620" fill="${c}"/>`
  const sun = (x = 860, y = 130, r = 70) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${C.hay}" opacity=".9" filter="url(#ps2)"/>`
  const cloud = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})" filter="url(#ps2)" fill="${C.cream}"><ellipse cx="0" cy="0" rx="70" ry="26"/><ellipse cx="-38" cy="-14" rx="34" ry="26"/><ellipse cx="22" cy="-22" rx="40" ry="32"/></g>`
  const hills = () => `
    <path d="M0 330 C180 260 330 300 470 280 C640 255 790 210 1080 260 L1080 620 L0 620Z" fill="${C.pale}" filter="url(#ps)"/>
    <path d="M0 400 C210 340 390 380 560 350 C760 315 900 330 1080 310 L1080 620 L0 620Z" fill="${C.leaf}" filter="url(#ps)"/>
    <path d="M0 480 C220 430 460 470 660 440 C840 414 960 430 1080 420 L1080 620 L0 620Z" fill="${C.mid}" filter="url(#ps)"/>`
  const barn = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})" filter="url(#ps2)">
    <rect x="-70" y="-60" width="140" height="100" fill="${C.cream}"/><path d="M-85 -55 L0 -120 L85 -55Z" fill="${C.moss}"/>
    <rect x="-24" y="-10" width="48" height="50" fill="${C.wood}"/><path d="M-24 -10 L24 40 M24 -10 L-24 40" stroke="${C.cream}" stroke-width="4"/>
    <circle cx="0" cy="-70" r="12" fill="${C.hay}"/></g>`
  const tree = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})" filter="url(#ps2)"><rect x="-8" y="-10" width="16" height="60" fill="${C.wood}"/><circle cx="0" cy="-40" r="46" fill="${C.moss}"/><circle cx="-26" cy="-20" r="30" fill="${C.mid}"/></g>`

  // 牛（左向き）。breed: holstein / jersey。scale 1 で胴の幅約280
  function cow(x, y, s = 1, { breed = 'holstein', flip = false, grazing = false } = {}) {
    const base = breed === 'jersey' ? C.brown : C.white
    const spot = breed === 'jersey' ? '#9a5e2f' : C.black
    const head = grazing ? 'translate(-150,20) rotate(-28)' : 'translate(-150,-62)'
    return `<g transform="translate(${x},${y}) scale(${flip ? -s : s},${s})" filter="url(#ps)">
      <path d="M138 -40 C170 -10 168 40 160 70" stroke="${base === C.white ? '#d8d8d2' : spot}" stroke-width="8" fill="none" stroke-linecap="round"/>
      <circle cx="160" cy="74" r="9" fill="${spot}"/>
      ${[-108, -70, 62, 100].map((lx) => `<rect x="${lx}" y="30" width="24" height="86" rx="8" fill="${base}"/><rect x="${lx}" y="104" width="24" height="14" rx="4" fill="${C.black}"/>`).join('')}
      <rect x="-142" y="-72" width="290" height="134" rx="62" fill="${base}"/>
      ${breed === 'holstein'
        ? `<path d="M-60 -72 C-20 -60 -10 -20 -40 0 C-70 20 -110 0 -112 -30 C-114 -55 -90 -74 -60 -72Z" fill="${spot}"/>
           <path d="M40 -40 C80 -60 120 -40 118 -5 C116 20 80 40 50 25 C25 12 15 -25 40 -40Z" fill="${spot}"/>
           <path d="M-10 30 C10 20 30 40 20 58 L-20 58 C-30 48 -24 36 -10 30Z" fill="${spot}"/>`
        : `<path d="M-142 -10 C-60 -30 60 -30 148 -10 L148 20 C60 40 -60 40 -142 20Z" fill="#c98a52" opacity=".5"/>`}
      <ellipse cx="38" cy="64" rx="30" ry="15" fill="${C.pink}"/>
      <g transform="${head}">
        <ellipse cx="-58" cy="-32" rx="26" ry="12" fill="${base === C.white ? C.black : spot}" transform="rotate(-20 -58 -32)"/>
        <ellipse cx="30" cy="-36" rx="26" ry="12" fill="${base === C.white ? C.black : spot}" transform="rotate(20 30 -36)"/>
        <path d="M-30 -48 C-34 -66 -26 -74 -20 -70 M10 -50 C14 -66 6 -74 0 -70" stroke="${C.cream}" stroke-width="8" stroke-linecap="round" fill="none"/>
        <ellipse cx="-14" cy="-8" rx="50" ry="52" fill="${base}"/>
        ${breed === 'holstein' ? `<path d="M-14 -60 C10 -58 30 -40 34 -18 C20 -24 6 -36 -14 -60Z" fill="${C.black}"/>` : ''}
        <ellipse cx="-22" cy="30" rx="42" ry="30" fill="${C.pink}"/>
        <ellipse cx="-38" cy="30" rx="6" ry="8" fill="#c97f7b"/><ellipse cx="-8" cy="30" rx="6" ry="8" fill="#c97f7b"/>
        <circle cx="-40" cy="-14" r="7" fill="${C.black}"/><circle cx="12" cy="-14" r="7" fill="${C.black}"/>
        <circle cx="-38" cy="-16" r="2" fill="#fff"/><circle cx="14" cy="-16" r="2" fill="#fff"/>
      </g></g>`
  }
  const grass = (x, y) => `<path d="M${x} ${y} l6 -22 l4 22 l6 -16 l4 16" stroke="${C.moss}" stroke-width="4" fill="none" stroke-linejoin="round"/>`
  const bale = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})" filter="url(#ps)">
    <rect x="-80" y="-60" width="160" height="120" rx="20" fill="${C.hay}"/>
    <ellipse cx="80" cy="0" rx="34" ry="60" fill="${C.hay2}"/><ellipse cx="80" cy="0" rx="20" ry="38" fill="none" stroke="${C.hay}" stroke-width="5"/>
    <path d="M-60 -60 L-60 60 M0 -60 L0 60" stroke="${C.hay2}" stroke-width="5"/></g>`
  const bottle = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})" filter="url(#ps)">
    <rect x="-52" y="-150" width="104" height="44" rx="10" fill="${C.moss}"/>
    <path d="M-44 -108 L-44 -80 C-74 -60 -80 -40 -80 0 L-80 140 C-80 160 -64 170 -48 170 L48 170 C64 170 80 160 80 140 L80 0 C80 -40 74 -60 44 -80 L44 -108Z" fill="${C.milk}"/>
    <rect x="-80" y="30" width="160" height="80" fill="${C.hay}"/>
    <path d="M-30 70 C-30 50 -10 44 0 56 C10 44 30 50 30 70 C30 86 0 100 0 100 C0 100 -30 86 -30 70Z" fill="${C.moss}"/></g>`
  const glass = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})" filter="url(#ps)">
    <path d="M-50 -90 L50 -90 L40 90 C38 100 30 104 22 104 L-22 104 C-30 104 -38 100 -40 90Z" fill="#e8efe6"/>
    <path d="M-46 -40 L46 -40 L40 90 C38 100 30 104 22 104 L-22 104 C-30 104 -38 100 -40 90Z" fill="${C.milk}"/>
    <path d="M-46 -40 C-20 -30 20 -50 46 -40" stroke="#eee" stroke-width="4" fill="none"/></g>`
  const table = () => `<rect x="0" y="470" width="1080" height="150" fill="${C.wood}" filter="url(#ps)"/><rect x="0" y="470" width="1080" height="18" fill="#a06d43"/>`
  const butter = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})" filter="url(#ps)">
    <ellipse cx="0" cy="40" rx="150" ry="34" fill="${C.cream}"/><path d="M-90 0 L60 -20 L110 10 L-40 34Z" fill="#f7dc8c"/><path d="M-90 0 L-40 34 L-40 74 L-90 40Z" fill="${C.hay2}"/><path d="M-40 34 L110 10 L110 50 L-40 74Z" fill="${C.hay}"/></g>`
  const carton = (x, y, s = 1, col = C.moss) => `<g transform="translate(${x},${y}) scale(${s})" filter="url(#ps2)">
    <path d="M-40 -110 L40 -110 L52 -80 L52 80 L-52 80 L-52 -80Z" fill="${C.milk}"/><path d="M-52 -80 L52 -80 L40 -110 L-40 -110Z" fill="${col}"/>
    <rect x="-52" y="0" width="104" height="44" fill="${col}"/><circle cx="0" cy="-30" r="16" fill="${C.hay}"/></g>`
  const shelf = () => `<rect x="120" y="150" width="840" height="300" rx="20" fill="${C.cream}" filter="url(#ps)"/><rect x="120" y="440" width="840" height="20" fill="${C.wood}"/>`
  const heart = (x, y, s = 1) => `<path transform="translate(${x},${y}) scale(${s})" d="M0 30 C-40 0 -50 -30 -26 -44 C-10 -52 0 -40 0 -32 C0 -40 10 -52 26 -44 C50 -30 40 0 0 30Z" fill="#e47c6c" filter="url(#ps2)"/>`
  const plus = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})" filter="url(#ps2)"><circle r="44" fill="${C.cream}"/><rect x="-10" y="-28" width="20" height="56" rx="4" fill="${C.moss}"/><rect x="-28" y="-10" width="56" height="20" rx="4" fill="${C.moss}"/></g>`
  const person = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})" filter="url(#ps)">
    <rect x="-36" y="-10" width="72" height="120" rx="30" fill="${C.moss}"/><circle cx="0" cy="-46" r="34" fill="#f1cfae"/>
    <path d="M-36 -56 C-30 -96 30 -96 36 -56 L36 -50 L-36 -50Z" fill="${C.hay2}"/><rect x="-44" y="-56" width="88" height="10" rx="5" fill="${C.hay2}"/></g>`

  const scenes = {
    // 牧場の牛（ふつうの質問）
    pasture: () => sky() + sun() + cloud(260, 120) + cloud(560, 90, 0.8) + hills() + barn(930, 320, 0.8) + tree(470, 330, 0.7) + cow(720, 440, 0.95) + cow(250, 480, 0.75, { flip: true, grazing: true }) + grass(120, 590) + grass(940, 600),
    // 子牛
    calf: () => sky() + sun(180, 120, 60) + cloud(760, 110) + hills() + barn(880, 320, 0.8) + cow(600, 430, 0.95) + cow(330, 490, 0.55, { flip: true }) + heart(450, 300, 0.9) + grass(200, 590),
    // ジャージーなど品種
    breeds: () => sky() + sun() + cloud(300, 110) + hills() + cow(360, 450, 0.85, { breed: 'jersey', flip: true }) + cow(740, 450, 0.85) + grass(560, 600),
    // 餌・草・配合
    feed: () => sky() + sun(900, 120, 60) + cloud(240, 110) + hills() + bale(230, 470, 0.9) + bale(860, 500, 0.7) + cow(560, 450, 0.9, { grazing: true }) + grass(380, 600) + grass(720, 600),
    // 牛乳そのもの・味・成分
    milk: () => sky('#eef2e4') + `<circle cx="540" cy="250" r="230" fill="${C.pale}" filter="url(#ps)"/>` + table() + bottle(450, 290, 1.1) + glass(660, 380, 1) + cow(880, 330, 0.35, { flip: true }) + `<circle cx="200" cy="140" r="22" fill="${C.hay}"/><circle cx="250" cy="180" r="12" fill="${C.hay}"/>`,
    // お店・値段・選び方
    shop: () => sky('#eef2e4') + shelf() + carton(270, 340, 1, C.moss) + carton(420, 340, 1, C.hay2) + carton(570, 340, 1, C.mid) + carton(720, 340, 1, C.moss) + carton(860, 360, 0.8, C.brown) + `<rect x="0" y="520" width="1080" height="100" fill="${C.pale}"/>`,
    // バター・乳製品
    butter: () => sky('#eef2e4') + `<circle cx="540" cy="260" r="220" fill="${C.pale}" filter="url(#ps)"/>` + table() + butter(470, 430, 1.2) + bottle(780, 300, 0.85) + `<circle cx="230" cy="160" r="26" fill="${C.hay}"/>`,
    // 牛の健康・病気
    health: () => sky() + sun(170, 120, 55) + hills() + barn(900, 320, 0.8) + cow(560, 450, 0.95) + plus(300, 260, 1) + heart(800, 210, 0.8) + person(250, 470, 0.9),
    // 酪農の仕事・人
    work: () => sky() + sun() + cloud(560, 100, 0.9) + hills() + barn(820, 330, 0.95) + person(330, 450, 1.1) + cow(600, 470, 0.75, { flip: true }) + bale(160, 520, 0.6),
  }
  window.drawArt = (kind) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 620" width="1080" height="620">${defs}${(scenes[kind] ?? scenes.pasture)()}<rect width="1080" height="620" fill="url(#paper)"/></svg>`
  window.artKinds = Object.keys(scenes)
})()
