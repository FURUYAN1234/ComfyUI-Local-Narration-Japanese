# v1.1.0 — Japanese narration / 日本語ナレーション

Consult AI to draft a script and voice, edit both in dialogs, then adopt the result before running. The execution node never selects a voice again. / AIに相談して台詞と声の下書きを作り、小窓で両方を編集してから採用します。実行ノードは声を選び直しません。

The first node now has a Run shortcut that opens mandatory pronunciation review. Cancelling that review is treated as a normal interruption and preserves any earlier audio. / 最初のノードに、必須の読み確認を開く実行ボタンを追加しました。読み確認の中止は通常の中断として扱い、以前の音声を保持します。

The final node fills its available height with a scrolling audio list. It labels retained audio as the previous result while a new run is pending or generating, then shows the current completion time after saving. / 最後のノードは利用可能な高さをスクロール式の音声一覧に使います。新しい実行が読み確認待ちまたは生成中は残っている音声を前回の結果と示し、保存後は今回の完了時刻を表示します。

The ZIP contains the workflow, custom node, installer and documentation; models, reference audio, local configuration and personal reading dictionaries are excluded. / ZIPにはワークフロー、カスタムノード、導入処理、説明書を同梱し、モデル、参照音声、ローカル設定、個人の読み辞書は含めません。

Validation includes real browser execution through the reading-review gate, completion/cancellation UI states, targeted client notifications, and package manifest verification. / 実ブラウザーでの読み確認を経由した実行、完了・中止UI、対象クライアントだけへの通知、パッケージマニフェスト検証を確認しました。

Linux/WSL2 + NVIDIA CUDA + an existing ComfyUI installation are required. Consultation additionally needs LM Studio and qwen/qwen3.5-9b; CPU fallback is not implemented. / LinuxまたはWSL2、NVIDIA CUDA、導入済みComfyUIが必要です。AI相談にはLM Studioとqwen/qwen3.5-9bも必要です。CPUへの自動切替は実装していません。
