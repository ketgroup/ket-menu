#!/usr/bin/env python3
"""Làm mới file dự phòng data/ncc/<token>.json từ API ket-app (giá mới nhất).
Tên file = token. Không in token ra log. API lỗi/404/dữ liệu không hợp lệ -> giữ file cũ."""
import json, glob, os, urllib.request, urllib.parse
API = "https://ket-app.vercel.app/api/ncc/gia-gan-nhat?token="
ok = keep = changed = 0
for i, f in enumerate(sorted(glob.glob("data/ncc/*.json")), 1):
    tk = os.path.basename(f)[:-5]
    try:
        req = urllib.request.Request(API + urllib.parse.quote(tk), headers={"Accept": "application/json", "User-Agent": "ket-menu-lam-moi-ncc"})
        with urllib.request.urlopen(req, timeout=20) as r:
            if r.status != 200: raise ValueError("status")
            j = json.loads(r.read().decode("utf-8"))
        root = j.get("data") if isinstance(j.get("data"), dict) else j
        if not (isinstance(root, dict) and root.get("ncc") and isinstance(root.get("mon"), list) and root["mon"]
                and all(isinstance(m, dict) and m.get("ten") for m in root["mon"])):
            raise ValueError("invalid")
        new = json.dumps(root, ensure_ascii=False, indent=1) + "\n"
        old = open(f, encoding="utf-8").read()
        ok += 1
        if new != old:
            open(f, "w", encoding="utf-8").write(new); changed += 1
            print(f"file #{i}: cập nhật ({len(root['mon'])} món)")
        else:
            print(f"file #{i}: không đổi")
    except Exception as e:
        keep += 1
        print(f"file #{i}: giữ file cũ ({type(e).__name__})")
print(f"Tổng: API hợp lệ {ok}, đổi {changed}, giữ cũ {keep}")
