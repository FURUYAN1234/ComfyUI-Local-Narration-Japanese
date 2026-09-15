# v1.1.4 — Direct script editing / 台詞の直接編集

Edit the adopted-script area directly and use compact Copy, Paste, Clear, Undo and Redo controls. Every edit synchronizes the generated sentence list; when the script is blank, the node Run button is disabled until text is restored or entered. / 採用済み台詞欄を直接編集し、小さなコピー・ペースト・クリア・戻す・やり直すを使えます。編集は生成対象の台詞一覧へ即時反映され、台詞が空の間は文字を戻すまたは入力するまでノードの実行ボタンを無効にします。

Validation covers direct-edit synchronization, clipboard operations, clear/undo/redo, Ctrl+Z/redo shortcuts, IME composition, empty-script execution blocking, ZIP manifest verification and a clean tagged rebuild. / 直接編集の同期、クリップボード操作、クリア・戻す・やり直す、Ctrl+Zなどのショートカット、日本語入力変換、空欄時の実行抑止、ZIPマニフェスト、クリーンなタグからの再構築を確認しました。

The ZIP includes the workflow, custom node, installer and documentation; models, personal dictionaries, reference audio, local settings and generated audio are excluded. / ZIPにはワークフロー・カスタムノード・導入処理・説明書を同梱し、モデル、個人の読み辞書、参照音声、ローカル設定、生成音声は含めません。

The release retains the adopted-script and adopted-voice workflow: AI consultation proposes a draft, Apply fixes the chosen script and voice, then Run opens the mandatory reading review. Generation does not choose a different speaker for later sentences. / AI相談で下書きを提案し、採用で台詞と声を確定してから、実行時に必須の読み確認を開く流れを維持します。生成中に後続台詞の話者を選び直しません。

Linux/WSL2 + NVIDIA CUDA + an existing ComfyUI installation are required. Consultation additionally needs LM Studio and qwen/qwen3.5-9b; CPU fallback is not implemented. / LinuxまたはWSL2、NVIDIA CUDA、導入済みComfyUIが必要です。AI相談にはLM Studioとqwen/qwen3.5-9bも必要です。CPUへの自動切替は実装していません。
