# v1.2.5 — Optional cloud narration / 任意のクラウド音声生成

Adds an optional external TTS provider to the narration workflow. Select an available voice by name, listen to its provider sample, or enter a Voice ID. The sample may be in a different language; verify Japanese pronunciation with generated audio. / ナレーション用ワークフローに外部TTSサービスを任意追加しました。利用可能な声を名前から選び、提供元サンプルを試聴するか、Voice IDを入力できます。サンプルは別の言語の場合があるため、日本語の発音は生成音声で確認してください。

The API key is entered in the dialog and kept only in the running application process. Approved text is sent after the reading review. Cloud generation may consume the provider's credits. / APIキーは入力画面から登録し、動作中のアプリケーションのメモリ内だけに保持します。読み確認で承認した台詞だけを送信します。クラウド生成では提供元の利用枠を消費する場合があります。

Gemini and local narration behavior are retained. The new workflow guide explains the optional provider and key handling. / 既存のクラウド音声とローカル音声の使い方は維持しています。新しいワークフロー説明に外部サービスとキー管理の案内を追加しました。
