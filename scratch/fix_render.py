import urllib.request
import json
import os
import time

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
            body = response.read().decode()
            if not body: return None
            return json.loads(body)
    except urllib.error.HTTPError as e:
        print(f"Error {e.code}: {e.read().decode()}")
        return None

# 1. Get all services
services = request("GET", "https://api.render.com/v1/services?limit=50")

api_staging_id = None
api_prod_id = None

for item in services:
    srv = item['service']
    name = srv['name']
    
    if name == 'kangayath-db':
        print(f"Deleting suspended unused database: {name} (ID: {srv['id']})")
        request("DELETE", f"https://api.render.com/v1/services/{srv['id']}")
    elif name == 'kangayath-api-staging':
        api_staging_id = srv['id']
    elif name == 'kangayath-api':
        api_prod_id = srv['id']

# Trigger manual fresh deploys for the APIs just in case they failed due to old env vars
if api_staging_id:
    print(f"\nTriggering clean deploy for kangayath-api-staging ({api_staging_id})")
    deploy = request("POST", f"https://api.render.com/v1/services/{api_staging_id}/deploys", {"clearCache": "do_not_clear"})
    print("Staging deploy triggered:", deploy['id'] if deploy else "Failed")

if api_prod_id:
    print(f"Triggering clean deploy for kangayath-api ({api_prod_id})")
    deploy = request("POST", f"https://api.render.com/v1/services/{api_prod_id}/deploys", {"clearCache": "do_not_clear"})
    print("Prod deploy triggered:", deploy['id'] if deploy else "Failed")

print("\nCleanup and redeploy initiated.")
