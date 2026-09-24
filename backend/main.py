from fastapi import FastAPI, Form
from fastapi.middleware.cors import CORSMiddleware
from indic_transliteration import sanscript
from indic_transliteration.sanscript import transliterate
from fastapi.responses import FileResponse
from pydantic import BaseModel
from transformers import AutoProcessor, MusicgenForConditionalGeneration
import scipy.io.wavfile as wav
import torch
from music_recommender import recommend_music
from deep_translator import GoogleTranslator
from langdetect import detect
import os
import base64
import requests
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv
from fastapi import UploadFile, File
import shutil
import whisper
import imageio_ffmpeg
import os
import subprocess
ffmpeg_path = imageio_ffmpeg.get_ffmpeg_exe()
os.environ["PATH"] += os.pathsep + os.path.dirname(ffmpeg_path)

print("FFmpeg path:", ffmpeg_path)
os.environ["PATH"] += os.pathsep + os.path.dirname(imageio_ffmpeg.get_ffmpeg_exe())
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
load_dotenv()

SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
SPOTIFY_REDIRECT_URI = os.getenv("SPOTIFY_REDIRECT_URI")
FRONTEND_URI = os.getenv("FRONTEND_URI")


class SongInput(BaseModel):
    songs: str
print("Loading MusicGen model...")


class TranslateInput(BaseModel):
    text: str
    fromLang: str
    toLang: str
class LyricsRequest(BaseModel):
    mood: str
    genre: str
    language: str

processor = AutoProcessor.from_pretrained("facebook/musicgen-small")
model = MusicgenForConditionalGeneration.from_pretrained("facebook/musicgen-small")
model.to("cpu")

print("Model loaded!")

print("Loading Whisper model...")
whisper_model = whisper.load_model("base")
print("Whisper loaded!")







app = FastAPI()




# Allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173",
    "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class MusicPrompt(BaseModel):
    mood: str
    genre: str
    tempo: str

@app.get("/")
def root():
    return {"status": "Backend running"}
def detect_script(text: str):
    for ch in text:
        code = ord(ch)
        if 0x0C00 <= code <= 0x0C7F:
            return "te"   # Telugu
        if 0x0B80 <= code <= 0x0BFF:
            return "ta"   # Tamil
        if 0x0900 <= code <= 0x097F:
            return "hi"   # Hindi
    return "roman"

def clean_roman(text: str) -> str:
    replacements = {
        "A": "a",
        "I": "i",
        "U": "u",
        "E": "e",
        "O": "o",
        "M": "m",
        "H": "h",
        "T": "t",
        "D": "d",
        "G": "g",
        "J": "j",
        "z": "s",
        "S": "s",
        "c": "ch"
    }

    for k, v in replacements.items():
        text = text.replace(k, v)

    return text.lower()
@app.post("/transliterate")
def phonetic_transliterate(
    text: str = Form(...),
    targetLang: str = Form(...)
):
    source_lang = detect_script(text)

    # Step 1: Convert source → ROMAN (phonetic pivot)
    if source_lang == "te":
        roman = transliterate(text, sanscript.TELUGU, sanscript.HK)
    elif source_lang == "ta":
        roman = transliterate(text, sanscript.TAMIL, sanscript.HK)
    elif source_lang == "hi":
        roman = transliterate(text, sanscript.DEVANAGARI, sanscript.HK)
    else:
        roman = text  # already roman

    # Step 2: Convert ROMAN → target script
    if targetLang == "te":
        output = transliterate(roman, sanscript.HK, sanscript.TELUGU)
    elif targetLang == "ta":
        output = transliterate(roman, sanscript.HK, sanscript.TAMIL)
    elif targetLang == "hi":
        output = transliterate(roman, sanscript.HK, sanscript.DEVANAGARI)
    else:
        output = clean_roman(roman)  # roman output

    return {
        "input": text,
        "roman": roman,
        "output": output,
        "detected_language": source_lang
    }
from fastapi.responses import StreamingResponse
import io
# 🎯 Convert timestamps → SRT
def create_srt(segments, path="lyrics.srt"):
    with open(path, "w", encoding="utf-8") as f:
        for i, seg in enumerate(segments, start=1):

            def format_time(t):
                h = int(t // 3600)
                m = int((t % 3600) // 60)
                s = int(t % 60)
                ms = int((t - int(t)) * 1000)
                return f"{h:02}:{m:02}:{s:02},{ms:03}"

            f.write(f"{i}\n")
            f.write(f"{format_time(seg['start'])} --> {format_time(seg['end'])}\n")
            f.write(seg["text"] + "\n\n")


@app.post("/generate-video")
async def generate_video(file: UploadFile = File(...)):

    os.makedirs("uploads", exist_ok=True)

    audio_path = f"uploads/{file.filename}"

    # save file
    with open(audio_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 🎤 Step 1: Whisper → timed lyrics
    result = whisper_model.transcribe(audio_path)
    segments = result["segments"]

    # 📄 Step 2: Create SRT
    srt_path = "uploads/lyrics.srt"
    create_srt(segments, srt_path)

    # 🖼️ Step 3: simple background
    bg_path = "uploads/bg.jpg"

    # create black background if not exists
    if not os.path.exists(bg_path):
        from PIL import Image
        img = Image.new("RGB", (1280, 720), color=(0, 0, 0))
        img.save(bg_path)

    # 🎬 Step 4: FFmpeg command
    output_path = "uploads/output.mp4"

    command = [
        "ffmpeg",
        "-y",
        "-loop", "1",
        "-i", bg_path,
        "-i", audio_path,
        "-vf", f"subtitles={srt_path}",
        "-shortest",
        "-c:v", "libx264",
        "-c:a", "aac",
        output_path
    ]

    subprocess.run(command, check=True)

    return FileResponse(output_path, media_type="video/mp4", filename="lyrics_video.mp4")




@app.post("/generate-music")
def generate_music(data: MusicPrompt):

    prompt = f"{data.mood} {data.genre} instrumental music with {data.tempo} tempo"

    inputs = processor(
        text=[prompt],
        padding=True,
        return_tensors="pt"
    )

    with torch.no_grad():
        audio_values = model.generate(**inputs, max_new_tokens=256)

    # get numpy audio
    audio = audio_values[0].cpu().numpy()

    # remove extra dimensions
    audio = audio.squeeze()

    # FIX SHAPE → (channels, samples) → (samples, channels)
    if audio.ndim == 2:
        audio = audio.T

    # normalize audio
    audio = audio / max(abs(audio).max(), 1e-6)

    # write to memory buffer instead of file
    buffer = io.BytesIO()
    wav.write(buffer, 32000, audio.astype("float32"))
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="audio/wav",
        headers={"Content-Disposition": "inline; filename=music.wav"}
    )
@app.post("/recommend-songs")
def recommend_songs(data: SongInput):
    try:
        result = recommend_music(data.songs)
        return result
    except Exception as e:
        return {"error": str(e)}
@app.post("/translate")
def translate_text(data: TranslateInput):

    text = data.text.strip()

    # detect language if auto
    if data.fromLang == "auto":
        detected = detect(text)
    else:
        detected = data.fromLang

    # translate
    translated = GoogleTranslator(
        source=detected,
        target=data.toLang
    ).translate(text)

    return {
        "translation": translated,
        "detected_language": detected
    }
# -------------------- SPOTIFY AUTH --------------------

@app.get("/spotify/login")
def spotify_login():
    scope = "user-read-private user-read-email"
    auth_url = (
        "https://accounts.spotify.com/authorize"
        f"?response_type=code"
        f"&client_id={SPOTIFY_CLIENT_ID}"
        f"&scope={scope}"
        f"&redirect_uri={SPOTIFY_REDIRECT_URI}"
        f"&show_dialog=true"
    )
    return RedirectResponse(auth_url)


@app.get("/spotify/callback")
def spotify_callback(code: str):
    auth_string = f"{SPOTIFY_CLIENT_ID}:{SPOTIFY_CLIENT_SECRET}"
    b64_auth = base64.b64encode(auth_string.encode()).decode()

    token_response = requests.post(
        "https://accounts.spotify.com/api/token",
        data={
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": SPOTIFY_REDIRECT_URI,
        },
        headers={
            "Authorization": f"Basic {b64_auth}",
            "Content-Type": "application/x-www-form-urlencoded",
        },
    )

    access_token = token_response.json().get("access_token")

    return RedirectResponse(f"{FRONTEND_URI}?token={access_token}")
@app.post("/transcribe-audio")
async def transcribe_audio(file: UploadFile = File(...)):

    os.makedirs("uploads", exist_ok=True)
    file_path = f"uploads/{file.filename}"

    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    url = "https://api.groq.com/openai/v1/audio/transcriptions"

    headers = {
        "Authorization": f"Bearer {os.getenv('GROQ_API_KEY')}"
    }

    files = {
        "file": open(file_path, "rb")
    }

    data = {
        "model": "whisper-large-v3"
    }

    response = requests.post(url, headers=headers, files=files, data=data)

    return response.json()
@app.post("/translate")
def translate_text(data: TranslateInput):

    text = data.text.strip()

    if data.fromLang == "auto":
        detected = detect(text)
    else:
        detected = data.fromLang

    translated = GoogleTranslator(
        source=detected,
        target=data.toLang
    ).translate(text)

    return {
        "translation": translated,
        "detected_language": detected
    }
@app.post("/generate-lyrics")
def generate_lyrics(data: LyricsRequest):

    prompt = f"""
You are a creative lyrics generator.

TASK:
Generate song lyrics.

DETAILS:
- Mood: {data.mood}
- Genre: {data.genre}
- Language: {data.language}

RULES:
- 8 to 10 lines
- Make it natural and emotional
- No explanations
- Only lyrics
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        temperature=0.8,
        n=1,   # 🔥 only one output
        messages=[
            {
                "role": "system",
                "content": "You generate only song lyrics."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    # ✅ safe extraction
    lyrics = response.choices[0].message.content.strip()

    return {
        "lyrics": lyrics
    }