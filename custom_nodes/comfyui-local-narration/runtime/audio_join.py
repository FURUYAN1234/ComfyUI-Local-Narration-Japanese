import numpy as np


# A half second is long enough to hear sentence boundaries without slowing a
# normal narration down noticeably. The node keeps this adjustable.
DEFAULT_PAUSE_MS = 800


def silence_samples(sample_rate, pause_ms=DEFAULT_PAUSE_MS):
    return max(0, round(sample_rate * max(0, pause_ms) / 1000))


def join_numpy_audio(waveforms, sample_rate, pause_ms=DEFAULT_PAUSE_MS):
    """Join complete sentence waveforms with silence only between sentences."""
    joined = []
    for waveform in waveforms:
        if joined:
            joined.append(np.zeros(silence_samples(sample_rate, pause_ms), dtype=np.float32))
        joined.append(waveform)
    return np.concatenate(joined) if joined else np.zeros(0, dtype=np.float32)
