#!/usr/bin/env python3
"""
note記事URLの引き当て結果（JSONL）を data/episodes.json と data/articles/*.json に反映する。

使い方:
  python scripts/merge_note_urls.py <jsonl...>

JSONL 1行の形式: {"date": "YYYY-MM-DD", "title": "配信タイトル", "url": "https://note.com/kawakamifarm/n/..."}
date+正規化タイトルで索引・記事を引き当てる。既存の noteUrl は上書きしない（先勝ち）。
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

    resolved: dict[str, str] = {}
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
                url = r["url"].split("?")[0]
                if not re.match(r"^https://note\.com/kawakamifarm/n/n[0-9a-f]+$", url):
                    bad += 1
                    continue
                key = r["date"] + "|" + norm_title(r["title"])
                resolved.setdefault(key, url)
            except (json.JSONDecodeError, KeyError):
                bad += 1
    print(f"resolved entries: {len(resolved)} (rejected {bad})", file=sys.stderr)

    idx_path = DATA / "episodes.json"
    idx = json.loads(idx_path.read_text(encoding="utf-8"))
    hit = 0
    for e in idx:
        if e.get("noteUrl"):
            continue
        url = resolved.get(e["date"] + "|" + norm_title(e["title"]))
        if url:
            e["noteUrl"] = url
            hit += 1
    idx_path.write_text(json.dumps(idx, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"episodes.json: +{hit} noteUrl", file=sys.stderr)

    ahit = 0
    for p in sorted((DATA / "articles").glob("*.json")):
        a = json.loads(p.read_text(encoding="utf-8"))
        if a.get("noteUrl"):
            continue
        url = resolved.get(a["date"] + "|" + norm_title(a["title"]))
        if url:
            a["noteUrl"] = url
            p.write_text(json.dumps(a, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            ahit += 1
    print(f"articles: +{ahit} noteUrl", file=sys.stderr)


if __name__ == "__main__":
    main()
