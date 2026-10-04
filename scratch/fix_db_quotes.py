import urllib.request
import json

API_KEY = "rnd_dgoXdxZwCOuw6slhSIKj18kkzHDQ"
HEADERS = {
    "Accept": "application/json",
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

def request(method, url, data=None):
    req = urllib.request.Request(url, headers=HEADERS, method=method)
    if data:
        req.data = json.dumps(data).encode('utf-8')
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode())

services = request("GET", "https://api.render.com/v1/services?limit=50")

for item in services:
    srv = item['service']
    if srv['name'] in ["kangayath-api-staging", "kangayath-api"]:
        print(f"Processing {srv['name']}...")
        env_vars_resp = request("GET", f"https://api.render.com/v1/services/{srv['id']}/env-vars")
        
        final_env_vars = []
        for ev in env_vars_resp:
            key = ev['envVar']['key']
            val = ev['envVar']['value']
            
            # Remove accidental quotes from DATABASE_URL
            if key == "DATABASE_URL" and val.startswith('"') and val.endswith('"'):
                val = val.strip('"')
                print(f"  Fixed quotes in {key}")
                
            final_env_vars.append({"key": key, "value": val})
            
        request("PUT", f"https://api.render.com/v1/services/{srv['id']}/env-vars", final_env_vars)
        
        # Trigger deploy
        request("POST", f"https://api.render.com/v1/services/{srv['id']}/deploys", {"clearCache": "do_not_clear"})
        print(f"  Redeployed {srv['name']}!")
