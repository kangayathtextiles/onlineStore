import urllib.request
import json
import os

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
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        print(f"Error {e.code}: {e.read().decode()}")
        raise

# 1. Get all services
services = request("GET", "https://api.render.com/v1/services?limit=50")
print(f"Found {len(services)} services.")

# Missing variables to inject
MISSING_VARS = {
    "ADMIN_API_KEY": "kangayath_admin_2026",
    "SUPABASE_URL": "https://gdojzkljtarbnwrmimes.supabase.co",
    "SUPABASE_STORAGE_BUCKET": "product-media"
}

for item in services:
    srv = item['service']
    if srv['name'] in ["kangayath-api-staging", "kangayath-api"]:
        print(f"\nProcessing {srv['name']} (ID: {srv['id']})...")
        
        # Get existing env vars
        env_vars_resp = request("GET", f"https://api.render.com/v1/services/{srv['id']}/env-vars")
        
        # Keep existing, but update/add our missing vars
        final_env_vars = []
        existing_keys = set()
        
        for ev in env_vars_resp:
            ev_data = ev['envVar']
            key = ev_data['key']
            existing_keys.add(key)
            final_env_vars.append({"key": key, "value": ev_data['value']})
            
        # Add missing
        for mk, mv in MISSING_VARS.items():
            if mk not in existing_keys:
                final_env_vars.append({"key": mk, "value": mv})
                print(f"  + Added {mk}")
            else:
                print(f"  ~ {mk} already exists.")
                
        # Update
        print("  Pushing updates...")
        request("PUT", f"https://api.render.com/v1/services/{srv['id']}/env-vars", final_env_vars)
        print("  Update successful!")

print("\nAll done!")
