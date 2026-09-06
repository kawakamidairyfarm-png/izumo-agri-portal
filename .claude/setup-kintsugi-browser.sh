#!/usr/bin/env bash
# 金継ぎ（.claude/skills/kintsugi）を Claude Code on the web で動かすための準備。
#  1) 同梱 playwright の依存を入れる（node_modules は git 管理外なのでセッションごとに必要）
#  2) 同梱 playwright が期待する Chromium の版ディレクトリを、環境に入っている版へ橋渡しする
#     （「playwright install」はこの環境では不要・非推奨。/opt/pw-browsers の既存ビルドを使う）
# 使い方: bash .claude/setup-kintsugi-browser.sh   （何度実行しても安全）
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SK="$ROOT/.claude/skills/kintsugi"
[ -d "$SK" ] || exit 0

if [ ! -d "$SK/node_modules/playwright" ]; then
  (cd "$SK" && npm i --no-audit --no-fund --silent) || echo "[kintsugi] npm i に失敗しました" >&2
fi

B="${PLAYWRIGHT_BROWSERS_PATH:-/opt/pw-browsers}"
[ -d "$B" ] || exit 0
BJ="$SK/node_modules/playwright-core/browsers.json"
[ -f "$BJ" ] || exit 0

want_chromium=$(node -e "const j=require('$BJ');console.log((j.browsers.find(b=>b.name==='chromium')||{}).revision||'')")
want_shell=$(node -e "const j=require('$BJ');console.log((j.browsers.find(b=>b.name==='chromium-headless-shell')||{}).revision||'')")

have_chrome=$(ls -d "$B"/chromium-[0-9]*/chrome-linux/chrome 2>/dev/null | head -1)
have_shell=$(ls -d "$B"/chromium_headless_shell-[0-9]*/chrome-linux/headless_shell 2>/dev/null | head -1)

if [ -n "$want_chromium" ] && [ -n "$have_chrome" ] && [ ! -e "$B/chromium-$want_chromium/chrome-linux64/chrome" ]; then
  mkdir -p "$B/chromium-$want_chromium/chrome-linux64" \
    && ln -sfn "$have_chrome" "$B/chromium-$want_chromium/chrome-linux64/chrome" \
    && touch "$B/chromium-$want_chromium/INSTALLATION_COMPLETE" \
    && echo "[kintsugi] chromium-$want_chromium -> $have_chrome"
fi
if [ -n "$want_shell" ] && [ -n "$have_shell" ] && [ ! -e "$B/chromium_headless_shell-$want_shell/chrome-headless-shell-linux64/chrome-headless-shell" ]; then
  mkdir -p "$B/chromium_headless_shell-$want_shell/chrome-headless-shell-linux64" \
    && ln -sfn "$have_shell" "$B/chromium_headless_shell-$want_shell/chrome-headless-shell-linux64/chrome-headless-shell" \
    && touch "$B/chromium_headless_shell-$want_shell/INSTALLATION_COMPLETE" \
    && echo "[kintsugi] headless_shell-$want_shell -> $have_shell"
fi
exit 0
