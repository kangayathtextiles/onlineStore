import urllib.request
import json

def fetch_json(url, headers=None):
    if headers is None: headers = {}
    headers['Accept'] = 'application/json'
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        return f"Error: {e}"

print("--- GITHUB ACTIONS STATUS (STAGING) ---")
gh_res = fetch_json("https://api.github.com/repos/kangayathtextiles/onlineStore/actions/runs?branch=staging")
if isinstance(gh_res, dict) and 'workflow_runs' in gh_res:
    runs = gh_res['workflow_runs'][:3]
    for r in runs:
        print(f"Commit: {r['head_commit']['message'].splitlines()[0][:50]}")
        print(f"Status: {r['status']}")
        print(f"Conclusion: {r['conclusion']}\n")
else:
    print(gh_res)

print("--- RENDER DEPLOYMENT STATUS ---")
RENDER_API_KEY = "rnd_dgoXdxZwCOuw6slhSIKj18kkzHDQ"
headers = {"Authorization": f"Bearer {RENDER_API_KEY}"}

services = fetch_json("https://api.render.com/v1/services?limit=50", headers)
if isinstance(services, list):
    for item in services:
        srv = item['service']
        if srv['name'] in ["kangayath-api-staging", "kangayath-api", "kangayath-web-staging"]:
            deploys = fetch_json(f"https://api.render.com/v1/services/{srv['id']}/deploys?limit=1", headers)
            if isinstance(deploys, list) and len(deploys) > 0:
                d = deploys[0]['deploy']
                print(f"Service: {srv['name']}")
                print(f"Status: {d['status']}")
                print(f"Finished At: {d.get('finishedAt', 'In Progress')}\n")
else:
    print(services)
