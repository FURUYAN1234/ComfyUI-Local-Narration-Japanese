import base64
import importlib.util
import io
import json
import urllib.error
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().parents[1] / "custom_nodes/comfyui-local-narration/runtime/gemini_api.py"
spec = importlib.util.spec_from_file_location("gemini_api", MODULE_PATH)
gemini_api = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gemini_api)


class Response:
    def __init__(self, payload):
        self.payload = payload

    def __enter__(self):
        return self

    def __exit__(self, *_):
        return False

    def read(self):
        return json.dumps(self.payload).encode()


def test_flash_and_lite_use_structured_style_and_return_wav():
    wav = b"RIFF-test-wave"
    seen = []

    def opener(request, timeout):
        seen.append((request, timeout, json.loads(request.data)))
        return Response({"steps": [{"content": [{"type": "audio", "data": base64.b64encode(wav).decode()}]}]})

    for model in sorted(gemini_api.MODELS):
        assert gemini_api.request_audio(model, "Kore", "正確な原稿。", "嬉しさを控えめに", "test-credential-not-a-real-api-key", opener=opener) == wav
    assert {item[2]["model"] for item in seen} == gemini_api.MODELS
    assert all(item[2]["input"][0]["content"][0]["text"] == "正確な原稿。" for item in seen)
    assert all(item[2]["input"][0]["content"][0]["annotations"][0]["style"] == "嬉しさを控えめに" for item in seen)
    assert all(item[2]["generation_config"]["speech_config"][0]["voice"] == "Kore" for item in seen)


def test_api_error_redacts_key():
    key = "test-secret-not-a-real-api-key"

    def opener(request, timeout):
        raise urllib.error.HTTPError(request.full_url, 401, "unauthorized", {}, io.BytesIO(("bad " + key).encode()))

    try:
        gemini_api.request_audio("gemini-3.8-flash-tts", "Kore", "本文", "自然に", key, opener=opener)
        raise AssertionError("HTTP error accepted")
    except RuntimeError as error:
        assert key not in str(error) and "[REDACTED]" in str(error)


def test_missing_audio_is_rejected():
    try:
        gemini_api.request_audio("gemini-3.8-flash-lite-tts", "Kore", "本文", "自然に", "test-credential-not-a-real-api-key", opener=lambda *_args, **_kwargs: Response({"steps": []}))
        raise AssertionError("missing audio accepted")
    except RuntimeError as error:
        assert "did not contain audio" in str(error)
