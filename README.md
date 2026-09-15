# Local Japanese Narration / 日本語おまかせナレーション

One ComfyUI workflow for Irodori and Qwen3-TTS, with AI/manual control and pronunciation review. / IrodoriとQwen3-TTSを1本で切り替え、AIおまかせ・手動設定・生成前の読み確認を使えるComfyUIワークフローです。

The workflow uses a compact left-to-right layout: consultation and adopted inputs, generation, then the scrolling audio result list. / ワークフローは、相談・採用済み入力、生成、スクロール式の音声結果一覧を左から右へ並べます。

## Workflow overview / ワークフロー全体図

![Local Japanese Narration workflow overview / 日本語ナレーションのワークフロー全体図](images/workflow.png)

The first node is where you consult AI or adopt manual script and voice settings; the center node generates after the required reading review; the right node plays and saves the completed audio. / 左の最初のノードでAI相談または手動の台詞・声設定を採用し、中央のノードで必須の読み確認後に生成し、右のノードで完成音声を再生・保存します。

## Download / 入手

Download the ZIP from [Releases](https://github.com/FURUYAN1234/ComfyUI-Local-Narration-Japanese/releases/latest). / リリースからZIPを入手してください。
The ZIP includes the workflow, custom node and setup scripts; models are downloaded separately. / ZIPにはワークフロー・カスタムノード・セットアップ処理を同梱し、モデルは別途取得します。

## Requirements / 必要な環境

The supported setup is Linux or Ubuntu on WSL2, Python 3.10–3.12, NVIDIA CUDA GPU and a working ComfyUI installation. / 対象はLinuxまたはWSL2のUbuntu、Python 3.10〜3.12、NVIDIA CUDA GPU、導入済みのComfyUIです。
The tested configuration has 16 GB VRAM; this is not a guaranteed minimum. / 検証環境のVRAMは16GBです。必要最小量を保証する値ではありません。
Install Git, FFmpeg, SoX and venv support. / Git・FFmpeg・SoX・venvを用意してください。

```bash
sudo apt update
sudo apt install git ffmpeg sox python3-venv
```

AI consultation additionally needs LM Studio, its `lms` CLI and the `qwen/qwen3.5-9b` model. / AI相談ではLM Studio、lms CLI、qwen/qwen3.5-9bモデルも必要です。
Manual mode does not use LM Studio. / 手動モードではLM Studioを使いません。
Download the LLM inside LM Studio before using AI mode. / AI利用前にLM Studio側でLLMを取得してください。
`LOCAL_NARRATION_LMS_CLI` can point to the CLI, and `LOCAL_NARRATION_LM_ENDPOINT` can override the API URL. / CLIの場所とAPI接続先は左記の環境変数で指定できます。
Windows LM Studio is detected from its standard installation on WSL. / WSLではWindows版LM Studioの標準配置を検出します。

## Install / 導入

Extract the ZIP, open its directory in Ubuntu, and replace the example ComfyUI path with yours. / ZIPを展開し、Ubuntuで展開先を開いて、例のComfyUIパスを自分の配置先に置き換えます。

```bash
python3 install.py --comfyui /path/to/ComfyUI
```

The installer creates separate environments for the two incompatible Transformers versions. / 互換性の異なるTransformersを分離するため、2つの専用環境を作ります。
Initial setup downloads Python packages and CUDA libraries and may take time and substantial disk space. / 初回はPythonパッケージとCUDAライブラリを取得するため、時間とディスク容量を使います。
Restart ComfyUI and open `03_音声/18_音声_ローカルナレーション/日本語ナレーション_TTS切替_AI・手動`. / ComfyUIを再起動し、左記のワークフローを開きます。
Press **Download models / 必須モデル一式を取得** on the generation node. / 音声生成ノードのモデル取得ボタンを押してください。
It downloads pinned Irodori, codec, watermark and Qwen model files; cached files are reused. / 指定版のIrodori・コーデック・透かし・Qwenモデルを取得し、取得済みファイルは再利用します。
Status appears in the node title, and failures are shown instead of reporting success. / ノード見出しに進捗を表示し、失敗時はエラーを表示します。
For CLI download after setup: / セットアップ後に端末で取得する場合：

```bash
/path/to/ComfyUI/custom_nodes/comfyui-local-narration/runtime/envs/irodori/bin/python \
  /path/to/ComfyUI/custom_nodes/comfyui-local-narration/runtime/download_models.py
```

Reference OFF requires no audio file. / 参照OFFでは音声ファイルは不要です。
Enable the separate reference node and upload suitable reference speech to use it. / 別の参照ノードをONにし、参照する発話音声をアップロードして使用します。

## Use / 使い方

1. Consult AI at the top of the first node, or enter your script and choose a voice yourself. / 最初のノード上部でAIに相談するか、自分で台詞と声を設定します。
2. Review and edit the proposed script and voice in the dialog, then Apply. / 小窓で提案された台詞と声を確認・修正し、採用します。
3. Confirm the adopted script and voice shown on the node. / ノード上の採用済み台詞と声を確認します。
4. Run, approve the original text and readings, then generate. / 実行し、原文と読みを承認してから生成します。
5. Play and save full audio or individual sentences in the final scrolling list. / 最後のスクロール一覧で全体・台詞別の音声を再生・保存します。

For a fully manual start, type directly in the adopted-script field or use Edit script → Voice settings → Run and review readings; this route does not open AI consultation. / すべて手入力する場合は、採用済み台詞欄へ直接入力するか「台詞を1文ずつ編集」→「声を確認・調整」→「実行して読みを確認」の順に操作し、AI相談は使いません。

The generation node has **Sentence silence / 全体音声の台詞間の無音（ms）**. It adds 800 ms of silence between each sentence only in the full narration; individual sentence MP3 files remain unchanged. Increase or decrease it in 50 ms steps to suit the video. / 音声生成ノードの **全体音声の台詞間の無音（ms）** は、全体音声だけで各台詞の間に800msの無音を入れます。台詞別MP3は変わりません。動画に合わせて50ms単位で調整できます。

### Consultation draft and adoption / 相談の下書きと採用

Choose whether AI updates both script and voice, only the script, or only the voice; the other item stays unchanged. / AIが更新する対象を「台詞と声」「台詞だけ」「声だけ」から選び、対象外の設定は維持します。
Without a sentence count, a new script defaults to five sentences with an introduction, concrete explanation and conclusion; explicit counts take priority. A deficient draft gets one automatic correction attempt. / 文数指定がなければ、新規原稿は導入・具体的な説明・まとめを含む5文を基本にし、明示した文数を優先します。文数などが不適合なら一度だけ自動で修正を求めます。
A final editorial pass expands weak drafts and removes unsupported assumptions about named works, settings and recent events. This uses the local model, not external source verification. / 下書きの後に校閲を行い、内容不足や、未指定の作品・設定・最近の動向の推測を見直します。ローカルモデルによる校閲であり、外部資料の照合ではありません。
For example, ask for five lines of narration. The proposal shows editable lines and voice settings; Apply transfers them to the node's sentence list and voice settings together. / 例えば「ナレーションを5行作って」と相談すると、編集できる台詞と声の提案を表示します。採用すると台詞一覧と声の設定へまとめて反映します。
Purpose examples are available inside the consultation dialog; there is no separate permanent purpose field on the node. / 用途の例は相談の小窓で選べます。ノード上に独立した用途入力欄は置きません。
The proposal is a draft until adopted. Cancelling leaves existing inputs intact. / 提案は採用するまで下書きです。キャンセルしても元の入力は変わりません。
Closing a pending consultation discards its result; computation finishes in the background. / 相談中に閉じると結果を採用しません。計算は終了まで続きます。
Consultation status, elapsed time, completion and errors appear at the top even while the dialog is open. / 小窓を開いている間も、画面上部に相談状況・経過時間・完了・エラーを表示します。

### Script and voice editing / 台詞と声の編集

Edit script uses one sentence per field, with Add, Remove and removal restore. Save updates both the node preview and the generated sentence list. / 台詞編集は1枠1文で、追加・削除・削除の取消ができます。保存するとノードの表示と生成対象の台詞一覧を同時に更新します。
The adopted-script field is directly editable. Copy, Paste, Clear, Undo and Redo stay in one compact row; typing, pasting and clearing immediately update the sentence list. Undo/Redo also support Ctrl/Cmd+Z, Ctrl+Y and Ctrl/Cmd+Shift+Z. / 採用済み台詞欄は直接編集できます。コピー・ペースト・クリア・戻す・やり直すを小さな1行にまとめ、入力・貼り付け・クリアは台詞一覧へ即時反映します。戻す・やり直すはCtrl/Cmd+Z、Ctrl+Y、Ctrl/Cmd+Shift+Zにも対応します。
When the script is empty, the node Run button is disabled and explains that a script is required. Restoring or entering text enables it again. / 台詞が空の間はノードの実行ボタンを無効にし、台詞が必要であることを表示します。文字を入力または戻すと再び実行できます。
Voice settings shows the adopted voice and lets you select or revise it. AI consultation proposes settings from your request; applying the proposal makes it the adopted voice. / 「声を確認・調整」は採用済みの声を表示し、選択・変更できます。AI相談は希望から設定を提案し、提案を採用するとその声が採用済みの声になります。
Edit voice offers model, character and tone presets; choosing Custom tone reveals a shared voice/tone text field. Seed controls are under Advanced. / 声の編集ではモデル・キャラクター・口調のプリセットを選べます。口調の「自由入力」で声質・口調の文章欄を表示します。候補番号は詳細設定へまとめています。
Run uses the adopted settings without another AI selection. Older workflows with undecided automatic settings must first adopt an AI proposal or a voice preset. / 実行では採用済みの設定を使い、AIによる再選定は行いません。旧ワークフローの未確定のおまかせ設定は、先にAI提案か声のプリセットを採用してください。
Original script text is retained; approved readings go to TTS. Reading approval cannot be bypassed. / 原稿は保持し、承認した読みをTTSへ渡します。読み承認は省略できません。
Save the workflow to retain adopted inputs and output file references. / 採用した入力と音声の参照情報を残すには、ワークフローを保存してください。
Reference audio is configured in the separate ON/OFF node. Disable reference audio before adopting a newly designed AI voice. Qwen reference/preset voices do not use voice-design text. / 参照音声は別ノードのON/OFFで設定します。AIで提案した新しい声を採用する場合は参照をOFFにしてください。Qwenの参照声・既定話者では声のデザイン文章を使いません。

## Many audio files / 音声が多い場合

Audio bytes stay in the ComfyUI output directory; the workflow retains file references. / 音声の実体はComfyUIのoutputフォルダーへ保存され、ワークフローにはファイルの参照情報を保持します。
The completed-audio node uses the height allocated to its node and scrolls internally for the full track and every sentence, with an MP3 download link for each. / 完成音声ノードは割り当てられたノードの高さを使い、全体音声と全台詞を内部スクロールで表示し、それぞれのMP3を保存できます。
All sentences stay in the scrolling list; audio loads on playback. / 全台詞をスクロール一覧に保持し、音声は再生時に読み込みます。
While a new run is waiting for reading approval or generating, retained audio is marked as the previous result. When the new result arrives, the list header changes to the current completed generation and shows its timestamp. / 新しい実行が読み確認待ちまたは生成中は、残っている音声を前回の結果として表示します。新しい結果が届くと、一覧の見出しを今回の生成完了と生成日時へ切り替えます。
Saving the workflow does not embed or copy audio files. Keep the corresponding output folder when moving to another computer. / ワークフローの保存は音声の埋め込み・コピーを行いません。別PCへ移す場合は対応する出力フォルダーも保持してください。

## Pronunciation review / 読み確認

![Reading review / 読み確認](images/reading-review.png)

Every sentence appears with the original above and editable hiragana below. / 全文を文ごとに、原文が上・編集できるひらがなが下に表示します。
Automatic conversion can misread names or context-dependent words; correct them before generation. / 自動変換は人名や文脈で読みが変わる語を誤る場合があるため、生成前に修正してください。
The memory checkbox saves edited sentence readings locally for reuse. / 記憶チェックで修正した文の読みをローカル保存し、次回に再利用します。
A confirmation warns that changes after generation starts require a new generation. / 開始前に、開始後の修正は再生成になることを確認します。
Regeneration may change intonation and duration; previous audio files remain. / 再生成で抑揚や長さが変わる場合があります。元の音声ファイルは残ります。
Cancel is on the left and Generate on the right. Cancelling is a normal interruption: it keeps existing audio and does not report a generation error. / 中止は左、生成は右に配置しています。中止は通常の中断として扱い、既存音声を残し、生成エラーとしては表示しません。

## Tuning and outputs / 調整と出力

Adjust speed, pitch, volume, pauses, Irodori steps/guidance and Qwen sampling. / 話速・音程・音量・間・Irodoriのステップと各強度・Qwenのサンプリングを調整できます。
Engine-specific settings affect only the selected engine. / モデル固有の設定は該当モデルだけに作用します。
Long text is split; subsequent designed-voice chunks use the first generated voice as reference. / 長文は分割し、声のデザイン時は最初の声を後続区間の参照に使います。
LM Studio runs on GPU and releases it before TTS generation. / LM StudioをGPUで実行し、解放してからTTSを生成します。

```text
ComfyUI/
├─ custom_nodes/comfyui-local-narration/
│  └─ runtime/
│     ├─ config.json
│     ├─ envs/
│     └─ private/narration_readings.json
├─ input/                         # reference audio / 参照音声
├─ user/default/workflows/03_音声/18_音声_ローカルナレーション/
└─ output/audio/LocalNarration/
   ├─ 日時_ID/                    # audio.wav, request.json, result.json
   └─ MP3/                        # playback and download / 再生・保存
```

Output JSON files record the script, readings, settings and result; they are not workflow JSON. / 出力JSONは原稿・読み・設定・結果の記録で、ワークフローとして読み込むものではありません。
Keep generated WAV as a future voice reference. / 生成WAVを次回の声の参照に利用できます。
Do not include personal dictionaries, input audio or local configuration when redistributing. / 再配布時は個人の辞書・入力音声・ローカル設定を含めないでください。

## Models and licenses / モデルとライセンス

Integration code: Apache-2.0. / 連携コードはApache-2.0です。

- [Irodori-TTS v4.1-Small](https://huggingface.co/Aratako/Irodori-TTS-v4.1-Small): MIT; follow the model card's additional usage restrictions, including consent for impersonation. / MIT。なりすましに関する同意要件など、モデルカードの追加利用条件も確認してください。
- [Qwen3-TTS](https://github.com/QwenLM/Qwen3-TTS): 1.7B VoiceDesign, CustomVoice and Base; Apache-2.0. / 1.7BのVoiceDesign・CustomVoice・Baseを使用。Apache-2.0です。
- [Irodori inference code](https://github.com/Aratako/Irodori-TTS), [DACVAE](https://github.com/facebookresearch/dacvae), [SilentCipher](https://github.com/SesameAILabs/silentcipher): downloaded from their projects; licenses remain with them. / 各プロジェクトから取得し、それぞれのライセンスが適用されます。

## Validation / 検証

Real GPU runs covered Irodori, Qwen preset/reference, long-text voice reuse and LM Studio automatic selection. / 実GPUでIrodori・Qwen既定話者と参照・長文の声再利用・LM Studio自動選択を検証しています。
Pronunciation still requires listening; ASR matching alone does not prove naturalness. / 発音は試聴が必要です。ASR一致だけで自然さを保証しません。
The initial environment setup was checked with existing compatible environments; a different PC may require CUDA or system-package adjustments. / 初期設定は既存の互換環境を指定して検証しており、別PCではCUDAやシステムパッケージの調整が必要な場合があります。

## Version / バージョン

v1.1.4: made the adopted-script area directly editable, added compact copy/paste/clear/undo/redo controls, and disabled the node Run button while the script is empty. / v1.1.4では、採用済み台詞欄を直接編集できるようにし、コピー・ペースト・クリア・戻す・やり直すを追加しました。台詞が空の間はノードの実行ボタンを無効にします。

v1.1.3: full narration now inserts 800 ms of silence between sentences by default. This affects only the combined full track; per-sentence MP3 files are unchanged. Regenerate the narration to apply a changed silence value to audio. / v1.1.3では、全体音声に台詞ごと800msの無音を標準で入れます。台詞別MP3は変わりません。間の設定を変更したあとは、音声を再生成して反映します。

v1.1.2: when narration is saved as per-sentence audio, the first generated design voice is retained as the reference for every later sentence. This keeps one speaker and delivery across the narration; Qwen built-in speakers and user reference audio remain fixed as before. / 台詞別MP3を作る場合も、最初の文で生成したデザイン声を後続の全台詞の参照声として保持し、ナレーション全体で話者・話し方を統一します。Qwenの用意された話者とユーザー指定の参照音声は従来どおり固定です。

v1.1.1: renamed the voice button to “Voice settings / 声を確認・調整” and documented the fully manual route, so an adopted AI voice is clearly an editable current setting, not an additional manual-selection step. / AIが提案して採用した声も現在の設定として確認・変更できることが伝わるよう、声のボタンを「Voice settings / 声を確認・調整」へ変更し、全手入力の手順を記載。

v1.1.0: redesigned draft/adopt consultation, unified sentence/voice editing, targeted progress notifications, the node Run shortcut, normal reading-review cancellation, and current-versus-previous audio result labels. / 相談の下書きと採用、台詞・声の編集、対象を絞った進行通知、ノード上の実行ボタン、通常の読み確認中止、今回・前回の音声結果表示を追加しました。

v1.0.0: unified TTS selection, AI/manual control, character menu, reading review and model download. / TTS切替・AI/手動・声キャラメニュー・読み確認・モデル取得を統合。
Manual input and notifications / 手動入力と通知

Manual dialogue uses the sentence dialog only; Cancel discards edits and Save commits them. / 手動の台詞入力は文ごとの小窓に一本化。キャンセルで編集を破棄し、保存で確定します。
Progress, elapsed seconds and completion appear at the top of the screen. / 画面上部に進行状況・経過秒数・完了通知を表示します。

AI consultation also shows status and elapsed time at the top of the screen while its dialog is open; proposal completion and errors appear there too. / AI相談の小窓を開いている間も、画面上部に状況と経過時間を表示し、提案完了・エラーも通知します。
