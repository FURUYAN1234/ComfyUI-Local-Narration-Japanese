# Local Japanese Narration / 日本語おまかせナレーション

One ComfyUI workflow for Irodori and Qwen3-TTS, with AI/manual control and pronunciation review. / IrodoriとQwen3-TTSを1本で切り替え、AIおまかせ・手動設定・生成前の読み確認を使えるComfyUIワークフローです。

![Japanese narration / 日本語ナレーション](images/thumbnail.png)

![Workflow / ワークフロー](images/workflow.png)

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

AI mode additionally needs LM Studio, its `lms` CLI and the `qwen/qwen3.5-9b` model. / AIモードではLM Studio、lms CLI、qwen/qwen3.5-9bモデルも必要です。
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

1. Choose a control mode in the preset panel. / プリセット欄で「AIにおまかせ」「一部を指定してAIにおまかせ」「すべて手動」を選びます。
2. Use the sentence editor in every mode, one sentence per field. / 全モードで台詞入力の小窓を使い、1枠に1文ずつ入力します。
3. Choose purpose, character and tone presets. Text fields appear only for Custom. / 用途・声キャラクター・口調はプリセットで選び、「自由入力」を選ぶと文章欄が表示されます。
4. Run, approve each sentence and reading, then generate. / 実行し、各文と読みを承認してから音声を生成します。

Automatic purpose uses the script without requiring a separate brief. / 用途の「台詞から自動判断」では、別の用途文章は不要です。
In partial mode, specified model, voice/tone and nonzero speed take priority; the remaining settings are chosen by AI. / 一部指定ではモデル・声や口調・0以外の話速を優先し、残りをAIが選びます。
Standard in manual mode uses a natural narration style. / 手動の「標準」は自然なナレーション設定です。
Character Custom opens the shared voice/tone instruction field. / 声キャラクターの「自由入力」は、声質・口調の共通指示欄を開きます。

### Consult and edit / 相談して修正

In AI modes, press the top **Consult AI** button to describe your wishes. The proposal appears in an editable dialog with model and speed controls. / AIモードの「おまかせ設定を相談・編集」で希望を伝えると、小窓に提案文とモデル・話速が表示され、修正できます。
Press **Apply** to adopt the result as specified settings; the mode switches to partial control. Cancel leaves all original settings intact. / 「修正内容を採用」で指定設定として反映し、一部指定モードへ切り替わります。キャンセルでは元の設定を変えません。
Custom purpose and voice/tone also offer consultation buttons to turn wishes into instruction text. / 用途・声質と口調の自由入力にも相談ボタンがあり、希望から指示文を作れます。
Consultation uses the configured local LM Studio model and does not rewrite the script. / 相談は設定済みのローカルLM Studioを使い、読み上げ台詞を書き換えません。
Closing a pending consultation discards its result; computation finishes in the background and then releases the model. / 相談中に閉じると結果は採用されません。計算は終了まで続き、その後モデルを解放します。
Consultation is unavailable while a generation is queued or running. / 生成の待機中・実行中は相談できません。
AI proposals are optional: normal Run still supports automatic voice selection followed by mandatory reading approval. / 相談は任意です。通常の実行でもAIによる音声設定の選定と、必須の読み承認を利用できます。

The original script is preserved; the approved reading is sent to TTS. / 原稿は保持し、承認した読みをTTSへ渡します。
Reference voice uses the separate ON/OFF node; Qwen reference mode does not apply voice/tone text. / 参照声は別のON/OFFノードを使います。Qwen参照モードでは声質・口調の文章指定は適用されません。

## Sentence input in every mode / 全モード共通の文章入力

Click **Script sentences** below the consultation button in the first node. / 最初のノードの相談ボタンの下にある「読み上げる台詞を1文ずつ入力・編集」を押します。
Enter one original sentence per field, keeping kanji. Add/remove with +/−; Undo restores the last removal. / 漢字交じりの原文を1枠1文で入力し、＋／－で追加・削除します。直前の削除は取り消せます。
Multiple sentences are split into separate fields before returning. / 複数文を入力した場合は、戻る前に1文ずつへ分けて確認できます。
The input window only edits text; it does not generate, play or download audio. / この窓は原稿編集専用で、生成・再生・保存は行いません。
Save and return, then use the normal Run button. / 入力を保存して戻り、通常の「実行」を押します。
Immediately before TTS, approve the original/readings dialog; old OFF flags do not bypass approval. / TTS直前に原文と読みの確認窓で承認します。旧設定のOFFでも承認を省略できません。
After generation, the final **Completed audio** node plays/downloads the whole audio and each sentence. / 生成後、最後の「完成音声」ノードで全体・各文の音声を再生・保存します。
Filenames use a 3-digit index and original sentence prefix, e.g. `001_こんにちは。.mp3`. / ファイル名は3桁番号＋原文冒頭です。
Each run uses a separate directory under `output/audio/LocalNarration/Blocks/`, retaining prior files. / 左記の配下へ実行ごとに別フォルダーで保存し、以前のファイルを残します。
Save the workflow to retain your sentence inputs. / 入力した文章を残すにはワークフローを保存してください。

The three fields are script, AI purpose, and voice/tone. Purpose is inactive in manual mode; voice/tone is not spoken. / 3つの欄は原稿・AIへの用途指示・声質と口調です。手動時は用途欄が無効で、声質と口調は読み上げません。
Reference voice is controlled by a separate ON/OFF node. OFF requires no audio file or placeholder. / 参照音声は別ノードのON/OFFで切り替えます。OFFでは音声ファイルや仮の無音ファイルは不要です。
Enable it and upload speech only when using a reference; AI automatic mode ignores it. / 参照声を使うときだけONにして音声をアップロードします。AIおまかせでは参照を使いません。
Irodori does not offer Qwen-only presets. Model-specific parameters are in Advanced settings, one model at a time. / IrodoriではQwen専用話者を選べません。モデル固有の値は詳細設定でモデルごとに表示します。

## Many audio files / 音声が多い場合

Audio bytes stay in the ComfyUI output directory; the workflow retains file references. / 音声の実体はComfyUIのoutputフォルダーへ保存され、ワークフローにはファイルの参照情報を保持します。
The completed-audio node uses a fixed-height scrolling list for the full track and every sentence, with an MP3 download link for each. / 完成音声ノードは高さを固定したスクロール一覧に全体音声と全台詞を表示し、それぞれのMP3を保存できます。
Only displayed audio players are created, and audio is loaded when played. / 表示中の再生欄だけを作り、音声は再生時に読み込みます。
Saving the workflow does not embed or copy audio files. Keep the corresponding output folder when moving to another computer. / ワークフローの保存は音声の埋め込み・コピーを行いません。別PCへ移す場合は対応する出力フォルダーも保持してください。

## Pronunciation review / 読み確認

![Reading review / 読み確認](images/reading-review.png)

Every sentence appears with the original above and editable hiragana below. / 全文を文ごとに、原文が上・編集できるひらがなが下に表示します。
Automatic conversion can misread names or context-dependent words; correct them before generation. / 自動変換は人名や文脈で読みが変わる語を誤る場合があるため、生成前に修正してください。
The memory checkbox saves edited sentence readings locally for reuse. / 記憶チェックで修正した文の読みをローカル保存し、次回に再利用します。
A confirmation warns that changes after generation starts require a new generation. / 開始前に、開始後の修正は再生成になることを確認します。
Regeneration may change intonation and duration; previous audio files remain. / 再生成で抑揚や長さが変わる場合があります。元の音声ファイルは残ります。
Cancel is on the left and Generate on the right. / 中止は左、生成は右に配置しています。

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

v1.0.0: unified TTS selection, AI/manual control, character menu, reading review and model download. / TTS切替・AI/手動・声キャラメニュー・読み確認・モデル取得を統合。
Manual input and notifications / 手動入力と通知

Manual dialogue uses the sentence dialog only; Cancel discards edits and Save commits them. / 手動の台詞入力は文ごとの小窓に一本化。キャンセルで編集を破棄し、保存で確定します。
Progress, elapsed seconds and completion appear at the top of the screen. / 画面上部に進行状況・経過秒数・完了通知を表示します。
