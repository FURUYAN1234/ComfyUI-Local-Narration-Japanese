# v1.1.3 — Japanese narration / 日本語ナレーション

Full narration now inserts 800 ms of silence between each sentence by default. The setting is named **Sentence silence / 全体音声の台詞間の無音（ms）** on the generation node and can be adjusted in 50 ms steps. It affects only the combined full track; individual sentence MP3 files remain unchanged. Existing audio files keep their previous timing, so regenerate after changing the value. / 全体音声に台詞ごと標準800msの無音を入れるようにしました。音声生成ノードの **Sentence silence / 全体音声の台詞間の無音（ms）** で50ms単位に調整できます。台詞別MP3は変わりません。既存音声の間隔は変わらないため、設定変更後は再生成してください。

The release retains the adopted-script and adopted-voice workflow: AI consultation proposes a draft, Apply fixes the chosen script and voice, then Run opens the mandatory reading review. Generation does not choose a different speaker for later sentences. / AI相談で下書きを提案し、採用で台詞と声を確定してから、実行時に必須の読み確認を開く流れを維持します。生成中に後続台詞の話者を選び直しません。

The ZIP contains the workflow, custom node, installer and bilingual documentation. Models, reference audio, local configuration and personal reading dictionaries are excluded. / ZIPにはワークフロー、カスタムノード、導入処理、英日併記の説明書を同梱します。モデル、参照音声、ローカル設定、個人の読み辞書は含みません。

Validation covers the 800 ms join helper, source/package syntax and manifest verification, plus the installed browser workflow displaying the v1.1.3 setting. / 800msの結合処理、ソース・配布パッケージの構文とマニフェスト、導入済みブラウザワークフローでのv1.1.3設定表示を確認しました。

Linux/WSL2 + NVIDIA CUDA + an existing ComfyUI installation are required. Consultation additionally needs LM Studio and qwen/qwen3.5-9b; CPU fallback is not implemented. / LinuxまたはWSL2、NVIDIA CUDA、導入済みComfyUIが必要です。AI相談にはLM Studioとqwen/qwen3.5-9bも必要です。CPUへの自動切替は実装していません。
