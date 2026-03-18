import requests
import os
from dotenv import load_dotenv
load_dotenv()

API_KEY = os.getenv("API_FOOTBALL_KEY", "")
API_HEADERS = {"x-apisports-key": API_KEY}
API_BASE = "https://v3.football.api-sports.io"

print("API Key:", API_KEY[:8], "...")

resp = requests.get(
    f"{API_BASE}/teams",
    headers=API_HEADERS,
    params={"league": 61, "season": 2024},
    timeout=8,
)
data = resp.json()
print("Status:", resp.status_code)
print("Errors:", data.get("errors"))
print("Results:", data.get("results"))
print("First 3 teams:", [(t["team"]["name"], t["team"]["id"]) for t in data.get("response", [])[:3]])