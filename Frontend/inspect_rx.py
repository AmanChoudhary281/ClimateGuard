import urllib.request

req = urllib.request.Request("https://climateguard.lovable.app/assets/routes-DMyyC4Ue.js", headers={"User-Agent": "Mozilla/5.0"})
content = urllib.request.urlopen(req).read().decode("utf-8")

idx = content.find("function Rx")
print(content[idx:idx+3500])
