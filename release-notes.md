# v1.2.6 — API key status / APIキーの設定状態

Missing ElevenLabs credentials now show ⚠️ on both the narration node and the key dialog. A configured session shows ✅. Local Irodori/Qwen requires no cloud API key. / ElevenLabsのAPIキーが未設定なら、音声企画ノードと入力窓に⚠️を表示します。このセッションに設定済みなら✅を表示します。ローカルIrodori・QwenにクラウドAPIキーは不要です。

This downloadable ZIP also includes the v1.2.5 optional ElevenLabs engine: named voice selection, provider preview, custom Voice ID and mandatory reading review before sending approved text. / 配布ZIPにはv1.2.5で追加した任意のElevenLabs音声生成も含みます。声の名前からの選択、提供元サンプルの試聴、Voice IDの手入力、送信前の必須の読み確認に対応します。

Validation: missing-key state checked in the actual ComfyUI browser; missing/configured UI transitions and existing provider integration checked with automated mocks; fresh ZIP extraction, full file hashes and clean tag rebuild compared. This update did not rerun paid speech generation. / 検証：実際のComfyUI画面で未設定表示を確認。未設定・設定済みのUI遷移と既存API連携はモック検査。ZIP新規展開・全ファイルハッシュ・クリーンなタグからの再ビルドを照合しました。今回の表示修正では有料音声生成を再実行していません。

Existing production workflow names, saved inputs and bookmarks stay in place when updating the installed node files. Preserve your edited workflow and private reading dictionary when upgrading; the supplied workflow is a public sample. / インストール済みノードを更新するとき、既存の本番ワークフロー名・保存済み入力・ブックマークは維持します。更新時は編集中のワークフローと個人用読み辞書を保持してください。同梱ワークフローは公開用サンプルです。
