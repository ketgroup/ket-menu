#!/usr/bin/env python3
"""Làm mới file dự phòng data/ncc/<token>.json từ API ket-app (giá mới nhất).
Tên file = token. Không in token ra log. API lỗi/404/dữ liệu không hợp lệ -> giữ file cũ."""
import json, glob, os, re, hashlib, urllib.request, urllib.parse
API = "https://ket-app.vercel.app/api/ncc/gia-gan-nhat?token="
ok = keep = changed = 0
jobs = []
# Chế độ 1: file tên = token (kiểu cũ). Bỏ qua file tên băm 16 hex.
for f in sorted(glob.glob("data/ncc/*.json")):
    name = os.path.basename(f)[:-5]
    if not re.fullmatch(r"[0-9a-f]{16}", name): jobs.append((name, f))
# Chế độ 2: token trong secret NCC_TOKENS (mỗi dòng 1 token) → file data/ncc/<sha256(token)[:16]>.json, chỉ làm mới file băm đã có.
for tk in os.environ.get("NCC_TOKENS", "").split():
    f = "data/ncc/" + hashlib.sha256(tk.encode()).hexdigest()[:16] + ".json"
    if os.path.exists(f): jobs.append((tk, f))
print(f"Số file cần làm mới: {len(jobs)}")
for i, (tk, f) in enumerate(jobs, 1):
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
