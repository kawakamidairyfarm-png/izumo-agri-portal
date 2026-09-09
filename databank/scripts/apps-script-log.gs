/**
 * 川上牧場 酪農データバンク — アクセスログの受け口（Google Apps Script）
 *
 * 使い方（1回だけ）:
 *   1. Google スプレッドシート「データバンク アクセスログ」を開く
 *   2. 拡張機能 → Apps Script → 「コード.gs」の中身を全部消して、このファイルの中身を貼り付け → 保存（Ctrl+S）
 *   3. デプロイ → 新しいデプロイ → 種類「ウェブアプリ」
 *        説明: ログ受け口 ／ 次のユーザーとして実行: 自分 ／ アクセスできるユーザー: 全員
 *      → デプロイ → アクセスを承認（自分のアカウントを選ぶ → 「詳細」→「（安全ではないページ）に移動」→ 許可）
 *   4. 表示された「ウェブアプリ」の URL（https://script.google.com/macros/s/…/exec）をコピーして、
 *      GitHub の Settings → Secrets and variables → Actions → Variables に LOG_ENDPOINT として登録
 *
 * サイトから届くのは次の5つだけ（個人を特定する情報は送っていない）:
 *   t = view（表示）/ click（外部リンクのクリック）
 *   p = 見たページ（例: /e/2026-09-07_n9f6800a）
 *   r = 来た元（例: note.com / instagram.com / line / 直接）
 *   l = クリックしたリンク（例: メルマガに登録する（無料） → kawakamifarm.net）
 *   d = sp（スマホ幅）/ pc
 * シートが無ければ最初の1件で自動で作る。集計シートの式も同時に作る。
 */

var LOG_SHEET = 'ログ';
var SUMMARY_SHEET = '集計';

function doPost(e) {
  return record_(parse_(e));
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (!p.t) return ContentService.createTextOutput('データバンクのログ受け口です。動いています。');
  return record_(p);
}

function parse_(e) {
  try {
    return JSON.parse(e.postData.contents);
  } catch (err) {
    return (e && e.parameter) || {};
  }
}

function record_(d) {
  var lock = LockService.getScriptLock();
  lock.tryLock(5000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(LOG_SHEET) || setup_(ss);
    sh.appendRow([
      new Date(),
      clip_(d.t || 'view', 16),
      clip_(d.p || '/', 200),
      clip_(d.r || '直接', 120),
      clip_(d.l || '', 200),
      clip_(d.d || '', 8),
    ]);
  } finally {
    lock.releaseLock();
  }
  return ContentService.createTextOutput('ok');
}

function clip_(v, n) {
  return String(v).replace(/[\r\n\t]/g, ' ').slice(0, n);
}

/** シートと集計の式を作る（自動で呼ばれる。手で作り直したいときは Apps Script の画面で setup を実行） */
function setup() {
  setup_(SpreadsheetApp.getActiveSpreadsheet());
}

function setup_(ss) {
  var sh = ss.getSheetByName(LOG_SHEET);
  if (!sh) {
    sh = ss.insertSheet(LOG_SHEET, 0);
    sh.appendRow(['日時', '種別', 'ページ', '来た元', 'クリック', '端末']);
    sh.getRange('A:A').setNumberFormat('yyyy-mm-dd hh:mm');
    sh.setFrozenRows(1);
    sh.setColumnWidths(1, 1, 140);
    sh.setColumnWidths(3, 3, 260);
  }
  var sm = ss.getSheetByName(SUMMARY_SHEET);
  if (!sm) {
    sm = ss.insertSheet(SUMMARY_SHEET, 0);
    var L = "'" + LOG_SHEET + "'!A:F";
    var rows = [
      ['今日の表示', '=COUNTIFS(' + L.replace('A:F', 'B:B') + ',"view",' + L.replace('A:F', 'A:A') + ',">="&TODAY())'],
      ['過去7日の表示', '=COUNTIFS(' + L.replace('A:F', 'B:B') + ',"view",' + L.replace('A:F', 'A:A') + ',">="&(TODAY()-7))'],
      ['過去30日の表示', '=COUNTIFS(' + L.replace('A:F', 'B:B') + ',"view",' + L.replace('A:F', 'A:A') + ',">="&(TODAY()-30))'],
      ['過去30日のメルマガ登録ボタン', '=COUNTIFS(' + L.replace('A:F', 'B:B') + ',"click",' + L.replace('A:F', 'E:E') + ',"*kawakamifarm.net*",' + L.replace('A:F', 'A:A') + ',">="&(TODAY()-30))'],
      ['', ''],
      ['日別の表示（新しい順・30日）', '=IFERROR(QUERY(' + L + ',"select toDate(A), count(A) where B=\'view\' group by toDate(A) order by toDate(A) desc limit 30 label toDate(A) \'日\', count(A) \'表示\'",1),"まだデータがありません")'],
    ];
    sm.getRange(1, 1, rows.length, 2).setValues(rows);
    sm.getRange('D1').setValue('よく見られたページ（30日）');
    sm.getRange('D2').setFormula('=IFERROR(QUERY(' + L + ',"select C, count(C) where B=\'view\' and A >= date \'"&TEXT(TODAY()-30,"yyyy-mm-dd")&"\' group by C order by count(C) desc limit 20 label C \'ページ\', count(C) \'表示\'",1),"まだデータがありません")');
    sm.getRange('G1').setValue('来た元（30日）');
    sm.getRange('G2').setFormula('=IFERROR(QUERY(' + L + ',"select D, count(D) where B=\'view\' and A >= date \'"&TEXT(TODAY()-30,"yyyy-mm-dd")&"\' group by D order by count(D) desc limit 20 label D \'来た元\', count(D) \'表示\'",1),"まだデータがありません")');
    sm.getRange('J1').setValue('押されたリンク（30日）');
    sm.getRange('J2').setFormula('=IFERROR(QUERY(' + L + ',"select E, count(E) where B=\'click\' and A >= date \'"&TEXT(TODAY()-30,"yyyy-mm-dd")&"\' group by E order by count(E) desc limit 20 label E \'リンク\', count(E) \'回数\'",1),"まだデータがありません")');
    sm.setColumnWidths(1, 1, 220);
    sm.setColumnWidths(4, 1, 260);
    sm.setColumnWidths(7, 1, 200);
    sm.setColumnWidths(10, 1, 320);
    sm.getRange('A1:A6').setFontWeight('bold');
    sm.getRange('D1').setFontWeight('bold');
    sm.getRange('G1').setFontWeight('bold');
    sm.getRange('J1').setFontWeight('bold');
  }
  return sh;
}
