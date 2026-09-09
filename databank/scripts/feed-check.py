#!/usr/bin/env python3
"""配信の RSS フィードを点検する。YouTube / Spotify が読めるかどうかの当たりをつけるための最小限。

  python3 feed-check.py https://anchor.fm/s/xxxx/podcast/rss

確認すること: HTTP の応答、XML として読めるか、番組名、カバー画像（itunes:image）の取得可否と大きさ、
最新エピソードの音声ファイルの取得可否、直近の item 一覧。
"""
import struct
import sys
import time
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET

UA = 'Mozilla/5.0 (compatible; feed-check/1.0; +https://kawakamidairyfarm-png.github.io/izumo-agri-portal/)'
NS = {'itunes': 'http://www.itunes.com/dtds/podcast-1.0.dtd'}


def fetch(url, method='GET', limit=None):
    req = urllib.request.Request(url, headers={'User-Agent': UA}, method=method)
    t0 = time.time()
    with urllib.request.urlopen(req, timeout=30) as r:
        body = r.read(limit) if limit else r.read()
        return r.status, {k.lower(): v for k, v in r.headers.items()}, body, time.time() - t0


def image_size(data):
    if data[:8] == b'\x89PNG\r\n\x1a\n':
        w, h = struct.unpack('>II', data[16:24])
        return 'PNG', w, h
    if data[:2] == b'\xff\xd8':
        i = 2
        while i < len(data) - 9:
            if data[i] != 0xFF:
                i += 1
                continue
            marker = data[i + 1]
            if marker in (0xC0, 0xC1, 0xC2):
                h, w = struct.unpack('>HH', data[i + 5:i + 9])
                return 'JPEG', w, h
            seg = struct.unpack('>H', data[i + 2:i + 4])[0]
            i += 2 + seg
        return 'JPEG', None, None
    return '不明', None, None


def main(url):
    print(f'フィード: {url}')
    for attempt in range(1, 4):
        try:
            status, headers, body, sec = fetch(url)
            break
        except urllib.error.HTTPError as e:
            print(f'  試行{attempt}: HTTP {e.code} {e.reason}')
            body = None
        except Exception as e:  # noqa: BLE001
            print(f'  試行{attempt}: 取得失敗 {type(e).__name__}: {e}')
            body = None
        time.sleep(3)
    if body is None:
        print('結論: フィードを取得できない。ホスティング側（Spotify for Creators）の問題。')
        return 1
    print(f'  HTTP {status}  {len(body):,} bytes  {sec:.1f}秒  content-type={headers.get("content-type")}')
    print(f'  last-modified={headers.get("last-modified")}  cache-control={headers.get("cache-control")}')

    try:
        root = ET.fromstring(body)
    except ET.ParseError as e:
        print(f'  XML として読めない: {e}')
        print('結論: フィードが壊れている。ホスティング側に問い合わせ。')
        return 1
    ch = root.find('channel')
    if ch is None:
        print('  <channel> がない。RSS ではない。')
        return 1
    print(f'  番組名: {ch.findtext("title")}')
    print(f'  説明: {(ch.findtext("description") or "")[:80]!r}')
    img = ch.find('itunes:image', NS)
    href = img.get('href') if img is not None else None
    print(f'  カバー画像: {href}')
    ok = True
    if href:
        try:
            s, h, data, sec = fetch(href)
            kind, w, hgt = image_size(data)
            print(f'    HTTP {s}  {len(data):,} bytes  {kind} {w}x{hgt}  content-type={h.get("content-type")}')
            if w and (w != hgt or w < 1400 or w > 3000):
                print('    注意: YouTube は 1400〜3000px の正方形のみ受け付ける')
                ok = False
        except Exception as e:  # noqa: BLE001
            print(f'    取得失敗: {e}')
            ok = False
    else:
        print('    itunes:image がない')
        ok = False

    items = ch.findall('item')
    print(f'  item 数: {len(items)}')
    for it in items[:5]:
        enc = it.find('enclosure')
        print(f'    - {it.findtext("pubDate")}  {it.findtext("title")}')
        if enc is not None:
            print(f'      音声: {enc.get("url")} ({enc.get("type")}, {enc.get("length")} bytes)')
    if items:
        enc = items[0].find('enclosure')
        if enc is not None and enc.get('url'):
            try:
                s, h, data, sec = fetch(enc.get('url'), limit=1024)
                print(f'  最新エピソードの音声: HTTP {s}  content-type={h.get("content-type")}  content-length={h.get("content-length")}')
            except Exception as e:  # noqa: BLE001
                print(f'  最新エピソードの音声: 取得失敗 {e}')
                ok = False
    dup = len(items) - len({(it.findtext('guid') or it.findtext('title')) for it in items})
    if dup:
        print(f'  注意: guid の重複が {dup} 件')
    print('結論: フィードは正常に読める。' if ok else '結論: フィードは読めるが、上の「注意」「取得失敗」を直す。')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else 'https://anchor.fm/s/5700b4e4/podcast/rss'))
