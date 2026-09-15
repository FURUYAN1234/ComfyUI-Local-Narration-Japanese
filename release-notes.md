# v1.1.5 — LM Studio consultation startup / LM Studio相談の起動待ち

AI consultation no longer waits for `lms server start` or `lms load` to exit. It starts the command in the background, checks the LM Studio API and the narration model until ready, and then continues the proposal. / AI相談で `lms server start` や `lms load` の終了待ちをしません。バックグラウンドで起動し、LM Studio APIと音声監督モデルの準備完了を確認してから提案を続けます。

An idle retained narration model is reused; a model currently processing still reports that consultation is in progress. / 待機中の音声監督モデルは再利用し、処理中のモデルだけは相談中として扱います。

The v1.1.4 direct editing, one-row clipboard controls, Undo/Redo, and empty-script Run guard remain available. / v1.1.4の台詞直接編集、1行のクリップボード操作、Undo/Redo、空欄時の実行無効化はそのまま利用できます。

Requirements: CUDA GPU, LM Studio with `qwen/qwen3.5-9b` for AI consultation, and Irodori or Qwen3-TTS for speech generation. / 必要環境：CUDA GPU、AI相談用の `qwen/qwen3.5-9b` を含むLM Studio、音声生成用のIrodoriまたはQwen3-TTS。
