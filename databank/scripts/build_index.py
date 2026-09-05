#!/usr/bin/env python3
"""
川上牧場 酪農データバンク: ローカルの文字起こしフォルダから索引と記事データを作る。

使い方（Windows の例）:
  python scripts/build_index.py --src "C:\\Users\\kawak\\Documents\\音声配信_NotebookLM用"
  python scripts/build_index.py --src <フォルダ> --ledger ソース台帳.csv
  python scripts/build_index.py --src <フォルダ> --summarize 20  # 要約が無い回を新しい順に20本要約（要 ANTHROPIC_API_KEY）

出力:
  data/episodes.json        全配信の索引（date, title, driveId, bytes, source）
  data/transcripts/*.txt    要約した回の全文（--summarize 指定時）
  data/articles/*.json      要約した回の構造化データ（--summarize 指定時）

前提:
  - 文字起こしファイル名は YYYYMMDD_タイトル.txt
  - サブフォルダも再帰的に読む（00_原文保管 なども含む）。all_knowledge_base.txt は除外。
  - 台帳CSVは Google スプレッドシート「川上牧場_音声配信ソース台帳」の「ソース台帳」シートを
    CSV でダウンロードしたもの。列: 配信日, タイトル, 分類, 検索キーワード, 200字要約, ..., ファイルID
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
ARTICLES = DATA / "articles"
TRANSCRIPTS = DATA / "transcripts"

NAME_RE = re.compile(r"^(\d{4})(\d{2})(\d{2})_+\s*(.+?)(?:\s*\((\d+)\))?\.txt$")


def norm_title(t: str) -> str:
    t = unicodedata.normalize("NFKC", t)
    t = re.sub(r"\s+", "", t)
    t = re.sub(r"[“”\"「」『』!！?？・:：、。…—─―]", "", t)
    return t.lower()


def slugify(date: str, title: str, drive_id: str) -> str:
    """記事IDを作る。Drive ID があればそれを、なければタイトルの簡易ハッシュを使う。"""
    if drive_id:
        return f"{date}_{drive_id[:8]}"
    h = 0
    for ch in norm_title(title):
        h = (h * 31 + ord(ch)) & 0xFFFFFFFF
    return f"{date}_{h:08x}"


def scan(src: Path) -> list[dict]:
    rows: dict[str, dict] = {}
    for p in sorted(src.rglob("*.txt")):
        if p.name == "all_knowledge_base.txt":
            continue
        m = NAME_RE.match(p.name)
        if not m:
            print(f"skip (name pattern): {p.name}", file=sys.stderr)
            continue
        y, mo, d, title, dup = m.groups()
        date = f"{y}-{mo}-{d}"
        title = title.strip()
        key = date + "|" + norm_title(title)
        source = "archive" if "原文保管" in str(p.parent) else "root"
        row = {"date": date, "title": title, "driveId": "", "bytes": p.stat().st_size, "source": source, "_path": str(p)}
        if key in rows:
            # 重複は原文保管を優先。同じフォルダなら (1) の付かない方を優先。
            prev = rows[key]
            if source == "archive" and prev["source"] != "archive":
                rows[key] = row
            elif source == prev["source"] and not dup and "(" in Path(prev["_path"]).name:
                rows[key] = row
            continue
        rows[key] = row
    return list(rows.values())


def merge_ledger(rows: list[dict], ledger_csv: Path) -> dict[str, dict]:
    """台帳CSVから Drive ID と分類・要約を引き当てる。戻り値は key -> 台帳行。"""
    by_key: dict[str, dict] = {}
    with ledger_csv.open(encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for r in reader:
            date = (r.get("配信日") or "").strip()
            title = (r.get("タイトル") or "").strip()
            if not re.match(r"^\d{4}-\d{2}-\d{2}$", date) or not title:
                continue
            if (r.get("正本判定") or "正本").strip() != "正本":
                continue
            by_key[date + "|" + norm_title(title)] = r
    hit = 0
    for row in rows:
        r = by_key.get(row["date"] + "|" + norm_title(row["title"]))
        if r:
            row["driveId"] = (r.get("ファイルID") or "").strip()
            cat = re.sub(r"^\d+_", "", (r.get("分類") or "").strip())
            if cat in ("酪農技術管理", "研修生教育", "ビジョン社会提言", "日常配信雑談"):
                row["category"] = cat
            hit += 1
    print(f"ledger: {hit}/{len(rows)} rows matched", file=sys.stderr)
    return by_key


def write_index(rows: list[dict]) -> None:
    DATA.mkdir(parents=True, exist_ok=True)
    out = [{k: v for k, v in r.items() if not k.startswith("_")} for r in rows]
    out.sort(key=lambda r: (r["date"], r["title"]), reverse=True)
    (DATA / "episodes.json").write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {DATA / 'episodes.json'} ({len(out)} entries)", file=sys.stderr)


SUMMARY_PROMPT = """あなたは酪農の専門編集者です。以下は島根県出雲市・川上牧場の音声配信の自動文字起こしです。
この内容だけを根拠に、次のJSONを日本語で作ってください。事実の追加や推測はしないでください。冒頭のジングルは要約に含めないでください。

{{
  "category": "酪農技術管理 | 研修生教育 | ビジョン社会提言 | 日常配信雑談 のいずれか",
  "audience": ["student" と "consumer" のうち該当するもの。student=酪農を志す人・研修生向け、consumer=一般消費者向け"],
  "tags": ["短い日本語タグを3〜6個"],
  "summary": "200字前後の要約。配信者の主張と結論を書く。",
  "keyPoints": ["要点を3〜6個、各1文"],
  "qa": [{{"q": "リスナーが聞きそうな質問", "a": "川上牧場の答え（本文に基づく、2〜3文）"}}],
  "quotes": ["本文からの印象的な一言を1〜2件、原文のまま短く"],
  "experience": "川上牧場自身の実体験として語られている部分を1〜2文で。なければ空文字",
  "caveats": "医学・栄養・制度・価格など、時点依存や要検証の内容があれば1〜2文で注意書き。なければ空文字"
}}

JSONのみを出力してください。

配信日: {date}
タイトル: {title}

--- 文字起こし ---
{text}
"""


def summarize(rows: list[dict], limit: int, model: str) -> None:
    try:
        import anthropic  # type: ignore
    except ImportError:
        print("pip install anthropic が必要です", file=sys.stderr)
        sys.exit(1)
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("環境変数 ANTHROPIC_API_KEY を設定してください", file=sys.stderr)
        sys.exit(1)
    client = anthropic.Anthropic()
    ARTICLES.mkdir(parents=True, exist_ok=True)
    TRANSCRIPTS.mkdir(parents=True, exist_ok=True)
    existing = {json.loads(p.read_text(encoding="utf-8")).get("driveId") for p in ARTICLES.glob("*.json")}
    existing_keys = {
        (j["date"] + "|" + norm_title(j["title"]))
        for j in (json.loads(p.read_text(encoding="utf-8")) for p in ARTICLES.glob("*.json"))
    }
    done = 0
    for row in sorted(rows, key=lambda r: r["date"], reverse=True):
        if done >= limit:
            break
        key = row["date"] + "|" + norm_title(row["title"])
        if (row["driveId"] and row["driveId"] in existing) or key in existing_keys:
            continue
        text = Path(row["_path"]).read_text(encoding="utf-8", errors="replace")
        slug = slugify(row["date"], row["title"], row["driveId"])
        print(f"summarizing {row['date']} {row['title'][:40]} -> {slug}", file=sys.stderr)
        # 長い文字起こしを渡すのでストリーミングで受け取る。
        # 安全分類による拒否時は fallbacks でサーバー側が別モデルに切り替える。
        with client.beta.messages.stream(
            model=model,
            max_tokens=16000,
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",
            messages=[{"role": "user", "content": SUMMARY_PROMPT.format(date=row["date"], title=row["title"], text=text)}],
        ) as stream:
            msg = stream.get_final_message()
        if msg.stop_reason == "refusal":
            print(f"  refused by the model, skipped: {slug}", file=sys.stderr)
            continue
        body = "".join(getattr(b, "text", "") for b in msg.content if getattr(b, "type", "") == "text").strip()
        body = re.sub(r"^```(?:json)?\s*|\s*```$", "", body)
        try:
            data = json.loads(body)
        except json.JSONDecodeError:
            print(f"  JSON parse failed, skipped: {slug}", file=sys.stderr)
            continue
        article = {
            "id": slug,
            "date": row["date"],
            "title": row["title"],
            "driveId": row["driveId"],
            "category": data.get("category", "酪農技術管理"),
            "audience": data.get("audience") or ["student", "consumer"],
            "tags": data.get("tags") or [],
            "summary": data.get("summary", ""),
            "keyPoints": data.get("keyPoints") or [],
            "qa": data.get("qa") or [],
            "quotes": data.get("quotes") or [],
            "experience": data.get("experience", ""),
            "caveats": data.get("caveats", ""),
            "noteUrl": "",  # 分かったら note 記事URLを手で追記（サイトが直接リンクに切り替わる）
            "transcriptFile": f"{slug}.txt",
        }
        (TRANSCRIPTS / f"{slug}.txt").write_text(text, encoding="utf-8")
        (ARTICLES / f"{slug}.json").write_text(json.dumps(article, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        done += 1
    print(f"summarized {done} episodes", file=sys.stderr)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--src", required=True, help="文字起こし .txt のあるフォルダ（再帰）")
    ap.add_argument("--ledger", help="ソース台帳CSV（任意。Drive ID と分類を引き当てる）")
    ap.add_argument("--summarize", type=int, default=0, help="要約が無い回を新しい順にN本要約する（Claude API）")
    ap.add_argument("--model", default="claude-opus-5", help="要約に使うモデル（既定: claude-opus-5）")
    args = ap.parse_args()

    src = Path(args.src)
    if not src.is_dir():
        print(f"フォルダが見つかりません: {src}", file=sys.stderr)
        sys.exit(1)

    rows = scan(src)
    print(f"scanned {len(rows)} transcripts", file=sys.stderr)

    # 既存の episodes.json にある Drive ID は引き継ぐ（台帳が無くてもリンクが切れないように）
    prev_path = DATA / "episodes.json"
    if prev_path.exists():
        prev = {r["date"] + "|" + norm_title(r["title"]): r for r in json.loads(prev_path.read_text(encoding="utf-8"))}
        for row in rows:
            p = prev.get(row["date"] + "|" + norm_title(row["title"]))
            if p and p.get("driveId"):
                row["driveId"] = p["driveId"]

    if args.ledger:
        merge_ledger(rows, Path(args.ledger))

    write_index(rows)

    if args.summarize > 0:
        summarize(rows, args.summarize, args.model)


if __name__ == "__main__":
    main()
