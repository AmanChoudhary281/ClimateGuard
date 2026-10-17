import urllib.request
import re

req = urllib.request.Request("https://climateguard.lovable.app/assets/routes-DMyyC4Ue.js", headers={"User-Agent": "Mozilla/5.0"})
content = urllib.request.urlopen(req).read().decode("utf-8")

matches = re.findall(r'["\']([^"\'\s]+\.(?:jpg|png|webp|jpeg))["\']', content)
print("Asset files referenced in routes bundle:")
for m in sorted(set(matches)):
    print("  ->", m)

# Search around earth / sphere / material
for kw in ['TextureLoader', 'texture', 'earth', 'cloud', 'atmos', 'night']:
    matches = list(re.finditer(kw, content, re.IGNORECASE))
    print(f"Total matches for {kw}: {len(matches)}")
    if matches:
        m = matches[0]
        idx = m.start()
        print(f"Sample for {kw}:", content[max(0, idx-60):min(len(content), idx+140)])
