# Changes / 更新履歴

## v1.2.2
- Added a private editable word-to-hiragana dictionary in reading review; entries are reused across sentences and saved outside workflow/ZIP. / 読み確認に編集可能な非公開の単語→ひらがな辞書を追加し、別の文でも再利用できるようにしました。辞書はワークフロー・ZIPに含めません。
- Switching Female/Male in Voice settings aligns a clear opposite-gender term in the custom tone and keeps the rest of the description. / 声の性別切替時に自由入力の明確な逆性別語を揃え、その他の口調を保持します。
- Apply also fixes a pre-existing clear mismatch, saves the selection and closes the dialog. Mixed gender instructions still require manual correction. / 既存の明確な食い違いも採用時に整合して保存・閉じます。男女が混在する指示は手動修正が必要です。

## v1.2.1

- Added Auto, Female, Male and Any voice-gender choices to manual settings and AI consultation. Qwen speakers and Gemini studio/design voices are grouped by gender; contradictory style instructions are rejected. / 手動設定とAI相談に声の性別「自動・女性・男性・任意」を追加しました。Qwen話者とGemini公式声・声イメージを性別で整理し、矛盾する口調指定は拒否します。
- Extended the local AI consultation response timeout and verified the ordinary ComfyUI path with short male and female Qwen outputs. / ローカルAI相談の応答待ち上限を延長し、ComfyUIの通常経路でQwenの男女話者による短い音声出力を確認しました。

## v1.2.0

- Added optional Gemini 3.8 Flash TTS and Flash-Lite TTS to the normal planning, reading-review, generation and saved-audio path. / Gemini 3.8 Flash TTSとFlash-Lite TTSを任意選択できる音声エンジンとして、通常の企画・読み確認・生成・音声保存経路へ追加しました。
- Added a session-only API dialog, 30 official studio voices, 20 Voice Design presets, free-form Voice Design, existing Voice ID and automatic/manual emotion controls. / セッション限定API入力窓、公式音声30種、Voice Design用プリセット20種、自由入力、既存Voice ID、感情の自動・手動設定を追加しました。
- AI selection offers Gemini only while an API key is registered; local Irodori and Qwen remain available without a Gemini key. Empty free-form voice descriptions are rejected before any API request. / AIの自動選択はAPI登録中だけGeminiを候補に加え、Irodori・QwenはGemini APIなしで従来どおり使えます。自由入力の声説明が空欄ならAPI送信前に停止します。
- Reordered the first-node controls to API registration, Voice settings, then AI consultation; removed the duplicate API button from the voice dialog. / 最初のノードをAPI登録→声の確認→AI相談の順にし、声設定窓の重複APIボタンを削除しました。

## v1.1.5

- Wait for LM Studio API and model readiness without blocking on `lms server start` or `lms load`; an idle retained model is reused. / `lms server start` と `lms load` の終了待ちをせず、LM StudioのAPI・モデル準備完了を確認します。待機中でない既存モデルは再利用します。

## v1.1.4

The adopted-script area is now directly editable with compact Copy, Paste, Clear, Undo and Redo controls. These actions synchronize the sentence list immediately; empty scripts disable the node Run button. / 採用済み台詞欄を直接編集できるようにし、コピー・ペースト・クリア・戻す・やり直すを追加しました。操作は台詞一覧へ即時反映し、台詞が空の間はノードの実行ボタンを無効にします。

## v1.1.3

Added a named sentence-silence setting to the generation node. Full narration inserts 800 ms between sentences by default, while each sentence MP3 remains unchanged. Existing audio must be regenerated to use a newly selected silence duration. / 音声生成ノードに台詞間無音の設定を追加しました。全体音声だけに標準800msの無音を入れ、台詞別MP3は変更しません。設定を変えた場合は再生成で反映します。


## v1.1.2

When per-sentence audio is generated from a voice design, retain the first sentence as the voice reference for every later sentence. This keeps one speaker and delivery for the full narration instead of designing a new speaker per sentence. Qwen built-in speakers and user reference audio remain unchanged. / 声デザインで台詞別音声を作るとき、最初の文の音声を後続の全台詞の参照声として使い、文章ごとに別の話者を設計しないよう修正しました。Qwenの用意された話者とユーザー指定の参照音声は従来どおりです。

## v1.1.1

Renamed the voice button to “Voice settings / 声を確認・調整” and documented the fully manual route, so an adopted AI voice is clearly an editable current setting, not an additional manual-selection step. / AIが提案して採用した声も現在の設定として確認・変更できることが伝わるよう、声のボタンを「Voice settings / 声を確認・調整」へ変更し、全手入力の手順を記載。

## v1.1.0

Redesigned the workflow around consultation, editable draft adoption and one shared voice setting. / 相談、編集可能な下書きの採用、共通の声設定を中心にワークフローを再設計。

Added the node Run shortcut, mandatory reading review, scoped progress notifications, normal cancellation, and a result header that distinguishes the current generation from retained audio. / ノード上の実行ボタン、必須の読み確認、対象を絞った進行通知、通常の中止、今回の生成と残っている音声を区別する結果見出しを追加。

## v1.0.0

Unified Irodori/Qwen workflow with AI/manual voice selection, character menus, pronunciation review and remembered readings. / Irodori・Qwenを統合し、AI/手動の声選択、キャラクターメニュー、読み確認と記憶に対応。

Download required TTS models from the generation node after initial environment setup. / 初回環境セットアップ後、生成ノードから必要なTTSモデルを取得。
