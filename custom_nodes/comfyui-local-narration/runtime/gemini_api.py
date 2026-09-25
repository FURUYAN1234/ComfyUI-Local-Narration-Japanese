import base64
import json
import urllib.error
import urllib.request

ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/interactions"
MODELS = {"gemini-3.8-flash-tts", "gemini-3.8-flash-lite-tts"}


def request_audio(model, voice, text, style, api_key, timeout=300, opener=urllib.request.urlopen):
    if model not in MODELS:
        raise ValueError("Gemini TTSモデルが不正です。")
    if not voice or not text.strip() or not api_key:
        raise ValueError("Gemini TTSの音声・原稿・APIキーが不足しています。")
    body = {
        "model": model,
        "input": [{
            "type": "user_input",
            "content": [{
                "type": "text",
                "text": text,
                "annotations": [{"type": "speech_metadata", "style": style}],
            }],
        }],
        "response_format": {"type": "audio", "mime_type": "audio/wav", "sample_rate": 24000},
        "generation_config": {"speech_config": [{"voice": voice}]},
    }
    request = urllib.request.Request(
        ENDPOINT,
        data=json.dumps(body, ensure_ascii=False).encode(),
        headers={"x-goog-api-key": api_key, "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with opener(request, timeout=timeout) as response:
            result = json.loads(response.read())
    except urllib.error.HTTPError as error:
        detail = error.read().decode(errors="replace")[-1500:].replace(api_key, "[REDACTED]")
        raise RuntimeError(f"Gemini TTS request failed ({error.code}): {detail}") from None
    except (OSError, ValueError) as error:
        raise RuntimeError("Gemini TTS request failed: " + str(error).replace(api_key, "[REDACTED]")) from None
    encoded = ""
    for step in result.get("steps", []):
        content = step.get("content", [])
        for item in content if isinstance(content, list) else []:
            if item.get("type") == "audio" and item.get("data"):
                encoded = item["data"]
    if not encoded:
        raise RuntimeError("Gemini TTS response did not contain audio.")
    try:
        return base64.b64decode(encoded, validate=True)
    except ValueError:
        raise RuntimeError("Gemini TTS response contained invalid audio data.") from None
