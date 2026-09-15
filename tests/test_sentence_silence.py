import importlib.util
from pathlib import Path


module_path = Path(__file__).parents[1] / "custom_nodes/comfyui-local-narration/runtime/audio_join.py"
spec = importlib.util.spec_from_file_location("audio_join", module_path)
audio_join = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audio_join)


def test_default_sentence_silence_is_half_second():
    assert audio_join.DEFAULT_PAUSE_MS == 800
    assert audio_join.silence_samples(48000) == 38400


def test_join_adds_silence_only_between_sentences():
    import numpy as np

    joined = audio_join.join_numpy_audio(
        [np.array([1.0, 1.0], dtype=np.float32), np.array([2.0], dtype=np.float32)],
        sample_rate=1000,
        pause_ms=3,
    )
    assert joined.tolist() == [1.0, 1.0, 0.0, 0.0, 0.0, 2.0]
