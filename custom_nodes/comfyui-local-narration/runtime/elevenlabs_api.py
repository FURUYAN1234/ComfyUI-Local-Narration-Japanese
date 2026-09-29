"""Small, dependency-free ElevenLabs API adapter for the narration worker."""
import json
import re
import urllib.error
import urllib.parse
import urllib.request

BASE = "https://api.elevenlabs.io"
MODEL = "eleven_multilingual_v2"
VOICE_ID = re.compile(r"[A-Za-z0-9_-]{8,80}\Z")


def _open(path, key, body=None, timeout=30, opener=urllib.request.urlopen):
    request = urllib.request.Request(
        BASE + path,
        data=None if body is None else json.dumps(body, ensure_ascii=False).encode(),
        headers={"xi-api-key": key, "Content-Type": "application/json"},
        method="GET" if body is None else "POST",
    )
    try:
        with opener(request, timeout=timeout) as response:
            return response.read()
    except urllib.error.HTTPError as error:
        detail = error.read().decode(errors="replace")[-1000:].replace(key, "[REDACTED]")
        raise RuntimeError(f"ElevenLabs API error ({error.code}): {detail}") from None
    except (OSError, ValueError) as error:
        raise RuntimeError("ElevenLabs API connection failed: " + str(error).replace(key, "[REDACTED]")) from None


def validate_key(key, opener=urllib.request.urlopen):
    if not key or any(c.isspace() for c in key):
        raise ValueError("ElevenLabs APIキー本体を入力してください。")
    # API keys can be scoped to speech synthesis. A models request would reject
    # a usable key that lacks the unrelated models_read permission.


def list_voices(key, opener=urllib.request.urlopen):
    voices = []
    token = None
    for _ in range(20):
        params = {"page_size": "100"}
        if token:
            params["next_page_token"] = token
        data = json.loads(_open("/v2/voices?" + urllib.parse.urlencode(params), key, opener=opener))
        for voice in data.get("voices", []):
            identifier = voice.get("voice_id", "")
            if VOICE_ID.fullmatch(identifier):
                preview = str(voice.get("preview_url") or "")
                labels = voice.get("labels") if isinstance(voice.get("labels"), dict) else {}
                voices.append({
                    "id": identifier,
                    "name": str(voice.get("name") or identifier)[:100],
                    "gender": str(labels.get("gender") or "")[:30],
                    "description": str(voice.get("description") or "")[:200],
                    "preview_url": preview if preview.startswith("https://") else "",
                })
        if not data.get("has_more"):
            return voices
        token = data.get("next_page_token")
        if not token:
            break
    raise RuntimeError("ElevenLabsの声一覧を最後まで取得できませんでした。")


def request_audio(voice_id, text, key, timeout=300, opener=urllib.request.urlopen):
    if not VOICE_ID.fullmatch(voice_id or "") or not text.strip() or not key:
        raise ValueError("ElevenLabsのVoice ID・原稿・APIキーを確認してください。")
    path = "/v1/text-to-speech/" + urllib.parse.quote(voice_id, safe="") + "?output_format=mp3_44100_128"
    return _open(path, key, {"text": text, "model_id": MODEL}, timeout=timeout, opener=opener)
