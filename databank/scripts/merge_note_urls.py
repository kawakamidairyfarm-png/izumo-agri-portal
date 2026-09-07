#!/usr/bin/env python3
"""
各プラットフォームの該当回URL引き当て結果（JSONL）を data/episodes.json と data/articles/*.json に反映する。

使い方:
  python scripts/merge_note_urls.py <jsonl...>

JSONL 1行の形式:
  {"date": "YYYY-MM-DD", "title": "配信タイトル", "url": "https://note.com/kawakamifarm/n/...", "platform": "note"}
platform は note / youtube / spotify（省略時は note）。
date+正規化タイトルで索引・記事を引き当てる。既存URLは上書きしない（先勝ち）。
"""
from __future__ import annotations

import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"


def norm_title(t: str) -> str:
    t = unicodedata.normalize("NFKC", t)
    t = re.sub(r"\s+", "", t)
    t = re.sub(r"[“”\"「」『』!！?？・:：、。…—─―]", "", t)
    return t.lower()


def main() -> None:
    if len(sys.argv) < 2:
        print(__doc__, file=sys.stderr)
        sys.exit(1)

    PATTERNS = {
        "note": (r"^https://note\.com/kawakamifarm/n/n[0-9a-f]+$", "noteUrl"),
        "youtube": (r"^https://(www\.)?(youtube\.com/watch\?v=[\w-]+|youtu\.be/[\w-]+)$", "youtubeUrl"),
        "spotify": (r"^https://open\.spotify\.com/episode/[0-9A-Za-z]+$", "spotifyUrl"),
    }
    resolved: dict[tuple[str, str], str] = {}
    bad = 0
    for arg in sys.argv[1:]:
        p = Path(arg)
        if not p.exists():
            print(f"skip missing {p}", file=sys.stderr)
            continue
        for line in p.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                r = json.loads(line)
                platform = r.get("platform", "note")
                pat, field = PATTERNS[platform]
                url = r["url"]
                if platform != "youtube":
                    url = url.split("?")[0]  # YouTubeは ?v= が本体なので残す
                else:
                    url = re.sub(r"([?&])(si|feature|t)=[^&]*", "", url).rstrip("?&")
                if not re.match(pat, url):
                    bad += 1
                    continue
                key = (r["date"] + "|" + norm_title(r["title"]), field)
                resolved.setdefault(key, url)
            except (json.JSONDecodeError, KeyError):
                bad += 1
    print(f"resolved entries: {len(resolved)} (rejected {bad})", file=sys.stderr)

    idx_path = DATA / "episodes.json"
    idx = json.loads(idx_path.read_text(encoding="utf-8"))
    hit = 0
    for e in idx:
        k = e["date"] + "|" + norm_title(e["title"])
        for field in ("noteUrl", "youtubeUrl", "spotifyUrl"):
            if e.get(field):
                continue
            url = resolved.get((k, field))
            if url:
                e[field] = url
                hit += 1
    idx_path.write_text(json.dumps(idx, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"episodes.json: +{hit} noteUrl", file=sys.stderr)

    ahit = 0
    for p in sorted((DATA / "articles").glob("*.json")):
        a = json.loads(p.read_text(encoding="utf-8"))
        k = a["date"] + "|" + norm_title(a["title"])
        changed = False
        for field in ("noteUrl", "youtubeUrl", "spotifyUrl"):
            if a.get(field):
                continue
            url = resolved.get((k, field))
            if url:
                a[field] = url
                changed = True
                ahit += 1
        if changed:
            p.write_text(json.dumps(a, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"articles: +{ahit} noteUrl", file=sys.stderr)


if __name__ == "__main__":
    main()
