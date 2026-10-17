import urllib.request
import re

req = urllib.request.Request("https://climateguard.lovable.app/assets/routes-DMyyC4Ue.js", headers={"User-Agent": "Mozilla/5.0"})
content = urllib.request.urlopen(req).read().decode("utf-8")

for m in re.finditer(r'earth[a-zA-Z0-9_\-\.]*', content, re.IGNORECASE):
    idx = m.start()
    print("Found around earth:", content[max(0, idx-100):min(len(content), idx+300)])
    print("-" * 50)
