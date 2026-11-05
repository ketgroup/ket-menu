#!/usr/bin/env python3
"""Sinh data/ncc/<slug>.json (giá mới nhất ket-app) cho trang ncc-gia.html?ncc=<slug>.
Token lấy từ secret NCC_TOKENS (mỗi dòng 1 token), không in token ra log.
Chỉ ghi khi API trả 200 + dữ liệu hợp lệ; lỗi/404 → giữ file cũ, không xoá."""
import json, os, glob, urllib.request, urllib.parse
# Giá cũ từ kho (data/ncc/_kho-gia.json, bot Web Menu sinh từ Brain kho): trộn vào từng món dạng gia_kho/ngay_kho/nguon_kho.
# JS chọn giá mới nhất theo ngày giữa giá NCC gửi (gia/ngay) và giá kho; bằng ngày thì giữ giá NCC gửi.
KHO = DVB = DVG = {}
try:
    _k = json.load(open("data/ncc/_kho-gia.json", encoding="utf-8")); KHO = _k.get("ncc", {}); DVB = _k.get("don_vi_bo_sung", {}); DVG = _k.get("don_vi_ghi_de", {})
except Exception as e: print("Không đọc được _kho-gia.json:", type(e).__name__)
def tron_kho(slug, root):
    k = KHO.get(slug, {}); dvb = DVB.get(slug, {})
    for m in root.get("mon", []):
        m.pop("don_vi_bo_sung", None)
        g = DVG.get(slug, {}).get(m.get("ma") or m.get("ten"))
        if g: m["don_vi"] = g  # đơn vị bắt buộc (anh Lan); API ket-app còn đơn vị cũ cũng không đè lại
        if not m.get("don_vi") and dvb.get(m.get("ma") or m.get("ten")): m["don_vi_bo_sung"] = dvb[m.get("ma") or m.get("ten")]
        for f in ("gia_kho", "ngay_kho", "nguon_kho"): m.pop(f, None)
        x = k.get(m.get("ma") or m.get("ten"))
        if x and x.get("gia"): m["gia_kho"], m["ngay_kho"], m["nguon_kho"] = x["gia"], x.get("ngay"), x.get("nguon")
    return root
# Giá NCC gửi qua form (Sheet «Kết – Form web», tab ncc-gia) đọc qua URL /exec ĐÃ công khai trong js/form-endpoint.js.
# Lỗi đọc → giữ gia_sheet cũ trong file (trang vẫn hiện giá mới nhất khi Apps Script hỏng).
import re as _re
try: EP = _re.search(r'"(https://script\.google\.com/[^"]+)"', open("js/form-endpoint.js", encoding="utf-8").read()).group(1)
except Exception: EP = ""
def doc_sheet(slug):
    if not EP: return None
    try:
        req = urllib.request.Request(EP + "?form=ncc&ncc=" + urllib.parse.quote(slug), headers={"User-Agent": "ket-menu-lam-moi-ncc"})
        with urllib.request.urlopen(req, timeout=30) as r: j = json.loads(r.read().decode("utf-8"))
        if not j.get("ok"): return None
        by = {}
        for x in j.get("items") or []:
            g = x.get("gia_moi") or x.get("gia")
            if not g or str(x.get("ma_ncc", slug)) == "thu-web-menu" or "thử" in str(x.get("nguoi", "")).lower() or "thử" in str(x.get("ghi_chu", "")).lower(): continue
            try: g = int(float(str(g).replace(".", "").replace(",", "")))
            except ValueError: continue
            k = x.get("ma") or x.get("ten"); t = str(x.get("gio_vn") or x.get("ngay") or "")
            if k and (k not in by or t >= by[k][2]): by[k] = (g, str(x.get("ngay") or t[:10]), t, str(x.get("don_vi") or ""))
        return by
    except Exception as e:
        print(f"{slug}: không đọc được Sheet ({type(e).__name__}), giữ giá Sheet cũ"); return None
def tron_sheet(root, by):
    if by is None: return root
    for m in root.get("mon", []):
        for f in ("gia_sheet", "ngay_sheet", "don_vi_sheet"): m.pop(f, None)
        x = by.get(m.get("ma") or m.get("ten")) or by.get(m.get("ten"))
        if x:
            m["gia_sheet"], m["ngay_sheet"] = x[0], x[1]
            if x[3]: m["don_vi_sheet"] = x[3]
    return root
SHEET = {}
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
        tron_kho(slug, root)
        if slug not in SHEET: SHEET[slug] = doc_sheet(slug)
        if SHEET[slug] is None:  # giữ giá Sheet cũ từ file hiện có
            try:
                om = {(m.get("ma") or m.get("ten")): m for m in json.load(open(f"data/ncc/{slug}.json", encoding="utf-8")).get("mon", [])}
                for m in root["mon"]:
                    o = om.get(m.get("ma") or m.get("ten"), {})
                    if o.get("gia_sheet"): m["gia_sheet"], m["ngay_sheet"] = o["gia_sheet"], o.get("ngay_sheet")
                    if o.get("don_vi_sheet"): m["don_vi_sheet"] = o["don_vi_sheet"]
            except Exception: pass
        else: tron_sheet(root, SHEET[slug])
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
# Chuyển nhóm NCC trên web (data/ncc/_chuyen-nhom.json): món rời trang cũ, sang trang mới (khớp mã NVL, không mã thì tên).
# Áp sau MỖI lần làm mới nên API trả món về nhóm cũ cũng không làm món quay lại trang cũ.
CN = []
try: CN = json.load(open("data/ncc/_chuyen-nhom.json", encoding="utf-8")).get("chuyen", [])
except Exception as e: print("Không đọc được _chuyen-nhom.json:", type(e).__name__)
def kmon(m): return m.get("ma") or str(m.get("ten", "")).strip().lower()
FILES = {os.path.basename(f)[:-5]: f for f in sorted(glob.glob("data/ncc/*.json")) if not os.path.basename(f).startswith("_")}
OLD = {s: open(f, encoding="utf-8").read() for s, f in FILES.items()}
DATA = {s: json.loads(t) for s, t in OLD.items()}
mang = {}
for c in CN:
    k = c.get("ma") or c["ten"].strip().lower(); src = DATA.get(c["tu"]); dst = DATA.get(c["sang"])
    if src is None or dst is None: continue
    for m in [m for m in src.get("mon", []) if kmon(m) == k]:
        src["mon"].remove(m); mang.setdefault(c["sang"], {})[k] = (m, c["tu"])
    if src is not None and not src.get("mon"): src["chuyen_het"] = c["sang"]
for s2, d in DATA.items():
    if d.get("mon"): d.pop("chuyen_het", None)
for sang, ms in mang.items():
    have = {kmon(m) for m in DATA[sang].get("mon", [])}
    for k, (m, tu) in ms.items():
        if k not in have: m["nhom_goc"] = tu; DATA[sang]["mon"].append(m)
for slug, f in FILES.items():
    old = OLD[slug]; root = tron_kho(slug, DATA[slug])
    if slug not in SHEET: SHEET[slug] = doc_sheet(slug)
    tron_sheet(root, SHEET[slug])
    new = json.dumps(root, ensure_ascii=False, indent=1) + "\n"
    if new != old: open(f, "w", encoding="utf-8").write(new); print(f"{slug}: trộn giá kho/Sheet")
print(f"Tổng: API hợp lệ {ok}, đổi {changed}, giữ cũ {keep}")
