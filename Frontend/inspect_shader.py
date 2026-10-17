import urllib.request
import re

req = urllib.request.Request("https://climateguard.lovable.app/assets/routes-DMyyC4Ue.js", headers={"User-Agent": "Mozilla/5.0"})
content = urllib.request.urlopen(req).read().decode("utf-8")

# Find the earth material and cloud material
for kw in ['earth-surface-clouds', 'ShaderMaterial', 'MeshStandardMaterial', 'MeshPhongMaterial']:
    for m in re.finditer(kw, content):
        idx = m.start()
        print(f"=== Match for {kw} at {idx} ===")
        print(content[max(0, idx-200):min(len(content), idx+600)])
        print("="*60)
        break
