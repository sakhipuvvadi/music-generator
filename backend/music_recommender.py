import os
import json
from groq import Groq
from dotenv import load_dotenv
import requests
import base64

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def recommend_music(user_songs: str):

    prompt = f"""
You are an expert music recommendation engine.

INPUT USER SONGS:
{user_songs}

TASK:
Recommend exactly 5 songs similar to user's taste.

STRICT RULES:
- Return ONLY valid JSON.
- No markdown.
- No explanation text.
- Do not wrap JSON in quotes.
- No comments.
- Do not include trailing commas.
- Do NOT generate Spotify links
-Do NOT generate Spotify links
- Provide realistic songs.
- Do not invent fake artists.
- give same language songs

REQUIRED JSON FORMAT:

{{
  "recommendations":[
    {{
      "title":"",
      "artist":"",
      "genre":"",
      "mood":"",
      "similarity_reason":"",
      "spotify_url":""
    }}
  ]
}}
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        temperature=0.7,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": "You output strictly valid JSON only."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    content = response.choices[0].message.content
    print(content)
    result = json.loads(content)

    token = get_spotify_token()
    for song in result["recommendations"]:
        song["spotify_url"] = get_spotify_link(
            song["title"],
            song["artist"],
            token
        )
        print("Yes",song["spotify_url"])
    print(result)
    return result
def get_spotify_token():
    client_id = os.getenv("SPOTIFY_CLIENT_ID")
    client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")

    auth_str = f"{client_id}:{client_secret}"
    auth_bytes = auth_str.encode("utf-8")
    auth_base64 = base64.b64encode(auth_bytes).decode("utf-8")

    url = "https://accounts.spotify.com/api/token"

    headers = {
        "Authorization": f"Basic {auth_base64}",
        "Content-Type": "application/x-www-form-urlencoded"
    }

    data = {"grant_type": "client_credentials"}

    response = requests.post(url, headers=headers, data=data)
    return response.json()["access_token"]
def get_spotify_link(title, artist, token):
    query = f"track:{title} artist:{artist}"   # better query

    url = "https://api.spotify.com/v1/search"

    headers = {
        "Authorization": f"Bearer {token}"
    }

    params = {
        "q": query,
        "type": "track",
        "limit": 1
    }

    res = requests.get(url, headers=headers, params=params)

    print("🔍 Query:", query)
    print("STATUS:", res.status_code)

    # ✅ CHECK RATE LIMIT
    if res.status_code == 429:
        print("🚨 RATE LIMIT HIT")
        print("Retry after:", res.headers.get("Retry-After"))
        return "Rate limit exceeded"

    # ✅ CHECK TOKEN ERROR
    if res.status_code == 401:
        print("❌ Token expired/invalid")
        return "Token error"

    # ✅ OTHER ERRORS
    if res.status_code != 200:
        print("❌ Spotify Error:", res.text)
        return "Not found"

    # ✅ SAFE JSON PARSE
    try:
        data = res.json()
    except:
        print("❌ Invalid JSON:", res.text)
        return "Not found"

    # ✅ SAFE ACCESS
    items = data.get("tracks", {}).get("items", [])

    if not items:
        return "Not found"

    return items[0]["external_urls"]["spotify"]
# def get_spotify_link(title, artist, token):
#     query = f"Title: {title} Artist: {artist}"

#     url = "https://api.spotify.com/v1/search"

#     headers = {
#         "Authorization": f"Bearer {token}"
#     }

#     params = {
#         "q": query,
#         "type": "track",
#         "limit": 1
#     }

#     res = requests.get(url, headers=headers, params=params)
#     data = res.json()
#     print(res)
#     try:
#         return data["tracks"]["items"][0]["external_urls"]["spotify"]
#     except:
#         return "Not found"