import importlib.util
import io
import json
import urllib.error
from pathlib import Path


path = Path(__file__).resolve().parents[1] / "custom_nodes/comfyui-local-narration/runtime/elevenlabs_api.py"
spec = importlib.util.spec_from_file_location("elevenlabs_api", path)
api = importlib.util.module_from_spec(spec)
spec.loader.exec_module(api)


class Response:
    def __init__(self, data):
        self.data = data

    def __enter__(self):
        return self

    def __exit__(self, *_):
        return False

    def read(self):
        return self.data


def test_key_voice_pagination_and_synthesis():
    seen = []

    def opener(request, timeout):
        seen.append((request, timeout))
        assert request.headers["Xi-api-key"] == "secret-example"
        if "next_page_token=next" in request.full_url:
            return Response(json.dumps({"voices": [{"voice_id": "voice00002", "name": "Voice B"}], "has_more": False}).encode())
        if "/v2/voices?" in request.full_url:
            return Response(json.dumps({"voices": [{"voice_id": "voice00001", "name": "Voice A", "preview_url": "https://example.com/a.mp3", "labels": {"gender": "female"}}], "has_more": True, "next_page_token": "next"}).encode())
        assert request.full_url.endswith("/v1/text-to-speech/voice00001?output_format=mp3_44100_128")
        assert json.loads(request.data) == {"text": "こんにちは。", "model_id": "eleven_multilingual_v2"}
        return Response(b"ID3-test")

    api.validate_key("secret-example", opener=opener)
    voices = api.list_voices("secret-example", opener=opener)
    assert [v["name"] for v in voices] == ["Voice A", "Voice B"]
    assert voices[0]["preview_url"] == "https://example.com/a.mp3"
    assert api.request_audio("voice00001", "こんにちは。", "secret-example", opener=opener) == b"ID3-test"
    assert len(seen) == 3


def test_invalid_voice_stops_before_paid_request_and_errors_redact_key():
    def forbidden(*_args, **_kwargs):
        raise AssertionError("request should not be sent")

    try:
        api.request_audio("../bad", "本文", "secret-example", opener=forbidden)
        raise AssertionError("invalid voice accepted")
    except ValueError:
        pass

    key = "secret-example"

    def denied(request, timeout):
        raise urllib.error.HTTPError(request.full_url, 401, "unauthorized", {}, io.BytesIO(("error " + key).encode()))

    api.validate_key(key, opener=forbidden)
    try:
        api.validate_key("bad key", opener=forbidden)
        raise AssertionError("malformed key accepted")
    except ValueError:
        pass
    try:
        api.request_audio("voice00001", "本文", key, opener=denied)
        raise AssertionError("denied request accepted")
    except RuntimeError as error:
        assert key not in str(error) and "[REDACTED]" in str(error)
