# v1.1.2 — Japanese narration / 日本語ナレーション

Per-sentence MP3 generation now locks a designed voice on the first sentence and uses it as the reference for every later sentence. The narration therefore keeps one speaker and delivery throughout, instead of redesigning the voice per sentence. Qwen built-in speakers and user-provided reference audio stay fixed as before. / 台詞別MP3の生成では、最初の文で決まったデザイン声を後続の全台詞の参照声として使います。文章ごとに声を設計し直さず、ナレーション全体で同じ話者・話し方を維持します。Qwenの用意された話者とユーザー指定の参照音声は従来どおり固定です。

The first node now labels its voice editor “Voice settings / 声を確認・調整” and documents the fully manual route: Edit script → Voice settings → Run and review readings. After applying an AI proposal, this button shows that adopted voice and lets you revise it; it does not require another manual choice. / 最初のノードの声編集ボタンを「Voice settings / 声を確認・調整」へ変更し、「台詞を1文ずつ編集 → 声を確認・調整 → 実行して読みを確認」という全手入力の手順も記載します。AI提案を採用した後は、その採用済みの声を表示・変更でき、改めて手動選択する必要はありません。

Consult AI to draft a script and voice, edit both in dialogs, then adopt the result before running. The execution node never selects a voice again. / AIに相談して台詞と声の下書きを作り、小窓で両方を編集してから採用します。実行ノードは声を選び直しません。

The first node now has a Run shortcut that opens mandatory pronunciation review. Cancelling that review is treated as a normal interruption and preserves any earlier audio. / 最初のノードに、必須の読み確認を開く実行ボタンを追加しました。読み確認の中止は通常の中断として扱い、以前の音声を保持します。

The final node fills its available height with a scrolling audio list. It labels retained audio as the previous result while a new run is pending or generating, then shows the current completion time after saving. / 最後のノードは利用可能な高さをスクロール式の音声一覧に使います。新しい実行が読み確認待ちまたは生成中は残っている音声を前回の結果と示し、保存後は今回の完了時刻を表示します。

The ZIP contains the workflow, custom node, installer and documentation; models, reference audio, local configuration and personal reading dictionaries are excluded. / ZIPにはワークフロー、カスタムノード、導入処理、説明書を同梱し、モデル、参照音声、ローカル設定、個人の読み辞書は含めません。

Validation includes real browser execution through the reading-review gate, completion/cancellation UI states, targeted client notifications, and package manifest verification. / 実ブラウザーでの読み確認を経由した実行、完了・中止UI、対象クライアントだけへの通知、パッケージマニフェスト検証を確認しました。

Linux/WSL2 + NVIDIA CUDA + an existing ComfyUI installation are required. Consultation additionally needs LM Studio and qwen/qwen3.5-9b; CPU fallback is not implemented. / LinuxまたはWSL2、NVIDIA CUDA、導入済みComfyUIが必要です。AI相談にはLM Studioとqwen/qwen3.5-9bも必要です。CPUへの自動切替は実装していません。
