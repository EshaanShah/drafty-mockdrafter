import requests
import json
from dotenv import load_dotenv
import os

# API info
url = "https://tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com/getNFLADP"
query = {"adpType": "halfPPR"}

load_dotenv()
api_key = os.getenv("RAPIDAPI_KEY")
headers = {
    "x-rapidapi-host": "tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com",
    "x-rapidapi-key": api_key
}

# 1. Call the API
response = requests.get(url, headers=headers, params=query)

# 2. Turn response into Python data
data = response.json()

# 3. Save to a file
with open("adp_halfPPR.json", "w") as f:
    json.dump(data, f, indent=2)

query = {"adpType": "PPR"}

headers = {
    "x-rapidapi-host": "tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com",
    "x-rapidapi-key": api_key
}

response = requests.get(url, headers=headers, params=query)

data = response.json()

with open("adp_fullPPR.json", "w") as f:
    json.dump(data, f, indent=2)

print("Saved ADP data to adp_halfPPR.json and full")
