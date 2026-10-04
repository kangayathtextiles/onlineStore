import urllib.request
import json

API_KEY = "rnd_dgoXdxZwCOuw6slhSIKj18kkzHDQ"
HEADERS = {
    "Accept": "application/json",
    "Authorization": f"Bearer {API_KEY}"
}

req = urllib.request.Request("https://api.render.com/v1/services/srv-da9sv4m7bikc73erj3fg/env-vars", headers=HEADERS)
with urllib.request.urlopen(req) as resp:
    vars = json.loads(resp.read().decode())
    for v in vars:
        val = v['envVar']['value']
        print(f"{v['envVar']['key']}: {'***HIDDEN***' if not val else val}")
