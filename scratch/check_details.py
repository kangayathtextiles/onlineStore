import urllib.request
import json
import zipfile
import io

def fetch_json(url):
    req = urllib.request.Request(url, headers={'Accept': 'application/json'})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

gh_res = fetch_json("https://api.github.com/repos/kangayathtextiles/onlineStore/actions/runs?branch=staging")
run_id = gh_res['workflow_runs'][0]['id']

jobs_res = fetch_json(f"https://api.github.com/repos/kangayathtextiles/onlineStore/actions/runs/{run_id}/jobs")
for job in jobs_res['jobs']:
    if job['conclusion'] == 'failure':
        print(f"FAILED JOB: {job['name']}")
        for step in job['steps']:
            if step['conclusion'] == 'failure':
                print(f"  Failed step: {step['name']}")

print("\nRENDER LOGS:")
RENDER_API_KEY = "rnd_dgoXdxZwCOuw6slhSIKj18kkzHDQ"
headers = {"Authorization": f"Bearer {RENDER_API_KEY}"}
deploys = fetch_json("https://api.render.com/v1/services/srv-da9sv4m7bikc73erj3fg/deploys?limit=1")
# Wait, Render logs are not easily accessible without a specific endpoint, let's just see which step failed on GitHub first
