#!/usr/bin/env python3
"""Kiểm thử lam-moi-ncc: mon=[] hợp lệ; HTTP lỗi → exit 1."""
import importlib.util
import os
import subprocess
import sys
import urllib.error

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
SCRIPT = os.path.join(ROOT, ".github/scripts/lam-moi-ncc.py")


def load_mod():
    spec = importlib.util.spec_from_file_location("lam_moi_ncc", SCRIPT)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def test_norm_root_empty():
    mod = load_mod()
    root = mod.norm_root({"data": {"ncc": "Bia Huda", "mon": []}})
    assert root["mon"] == [] and root["ncc"] == "Bia Huda"
    try:
        mod.norm_root({"data": {"ncc": "X", "mon": [{"dl": 1}]}})
        raise AssertionError("expected invalid-mon-item")
    except ValueError as e:
        assert "invalid-mon" in str(e)


def test_mock_run():
    ok_src = r'''
import json, urllib.request, urllib.error, importlib.util, sys
SCRIPT = ''' + repr(SCRIPT) + r'''
spec = importlib.util.spec_from_file_location("lam", SCRIPT)
lam = importlib.util.module_from_spec(spec); spec.loader.exec_module(lam)
class R:
    def __init__(self, b): self._b=b; self.status=200
    def read(self): return self._b
    def __enter__(self): return self
    def __exit__(self,*a): pass
def urlopen(req, timeout=None):
    u = req.full_url if hasattr(req,"full_url") else req.get_full_url()
    if "ket-app.vercel.app" in u:
        return R(json.dumps({"data": {"ncc": "Bia Huda", "ma_ncc": "BIA", "mon": []}}).encode())
    if "script.google.com" in u:
        return R(json.dumps({"ok": True, "items": []}).encode())
    raise urllib.error.HTTPError(u, 503, "down", None, None)
urllib.request.urlopen = urlopen
sys.exit(lam.main())
'''
    err_src = r'''
import urllib.request, urllib.error, importlib.util, sys
SCRIPT = ''' + repr(SCRIPT) + r'''
spec = importlib.util.spec_from_file_location("lam", SCRIPT)
lam = importlib.util.module_from_spec(spec); spec.loader.exec_module(lam)
def urlopen(req, timeout=None):
    raise urllib.error.HTTPError("https://ket-app.vercel.app/x", 401, "Unauthorized", None, None)
urllib.request.urlopen = urlopen
sys.exit(lam.main())
'''
    env = os.environ.copy()
    env["NCC_TOKENS"] = "mock-token-1"
    p = subprocess.run([sys.executable, "-c", ok_src], cwd=ROOT, env=env, text=True, capture_output=True)
    assert p.returncode == 0, p.stdout + p.stderr
    p2 = subprocess.run([sys.executable, "-c", err_src], cwd=ROOT, env=env, text=True, capture_output=True)
    assert p2.returncode == 1, p2.stdout + p2.stderr


def main():
    test_norm_root_empty()
    test_mock_run()
    print("test-lam-moi-ncc: OK")


if __name__ == "__main__":
    main()
