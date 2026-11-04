#!/usr/bin/env python3
"""Sinh data/ncc/<slug>.json (giá mới nhất ket-app) cho trang ncc-gia.html?ncc=<slug>.
Token lấy từ secret NCC_TOKENS (mỗi dòng 1 token), không in token ra log.
Chỉ ghi khi API trả 200 + dữ liệu hợp lệ; lỗi/404 → giữ file cũ, không xoá."""
import json, os, urllib.request, urllib.parse
API = "https://ket-app.vercel.app/api/ncc/gia-gan-nhat?token="
# Tên NCC trong API → slug link cố định (ncc-gia.html?ncc=<slug>)
SLUG = {"Trái cây": "trai-cay", "Chợ – Snack": "cho-snack", "Rượu Hải Gia Cát": "hai-gia-cat", "Online / Chợ lẻ": "cho-le",
        "Bia Huda": "bia-huda", "Hoa": "hoa", "Vinamilk": "vinamilk", "Nước ngọt": "nuoc-ngot", "Syrup": "syrup",
        "Chị Hồng Chợ Hàn": "chi-hong"}
toks = os.environ.get("NCC_TOKENS", "").split()
ok = keep = changed = 0
print(f"Số token: {len(toks)}")
for i, tk in enumerate(toks, 1):
    try:
        req = urllib.request.Request(API + urllib.parse.quote(tk), headers={"Accept": "application/json", "User-Agent": "ket-menu-lam-moi-ncc"})
        with urllib.request.urlopen(req, timeout=20) as r:
            if r.status != 200: raise ValueError("status")
            j = json.loads(r.read().decode("utf-8"))
        root = j.get("data") if isinstance(j.get("data"), dict) else j
        if not (isinstance(root, dict) and root.get("ncc") and isinstance(root.get("mon"), list) and root["mon"]
                and all(isinstance(m, dict) and m.get("ten") for m in root["mon"])):
            raise ValueError("invalid")
        slug = SLUG.get(root["ncc"])
        if not slug: raise ValueError("no-slug:" + root["ncc"])
        root["slug"] = slug
        f = f"data/ncc/{slug}.json"
        new = json.dumps(root, ensure_ascii=False, indent=1) + "\n"
        old = open(f, encoding="utf-8").read() if os.path.exists(f) else ""
        ok += 1
        if new != old:
            open(f, "w", encoding="utf-8").write(new); changed += 1
            print(f"#{i} {slug}: cập nhật ({len(root['mon'])} món)")
        else:
            print(f"#{i} {slug}: không đổi")
    except Exception as e:
        keep += 1
        print(f"#{i}: giữ file cũ ({type(e).__name__} {e if 'slug' in str(e) else ''})")
print(f"Tổng: API hợp lệ {ok}, đổi {changed}, giữ cũ {keep}")
