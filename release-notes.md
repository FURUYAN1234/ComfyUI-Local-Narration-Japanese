# v1.2.0 — Optional Gemini TTS / Gemini TTSの任意選択

Gemini 3.8 Flash TTS and Flash-Lite TTS are now optional engines in the same ComfyUI narration workflow as local Irodori and Qwen3-TTS. Both Gemini engines use the normal adopted-script, mandatory reading-review, generation and final playback/save path. / Gemini 3.8 Flash TTSとFlash-Lite TTSを、ローカルのIrodori・Qwen3-TTSと同じComfyUIナレーションワークフローで任意選択できるようにしました。どちらのGeminiも、採用済み原稿、必須の読み確認、音声生成、最終ノードの再生・保存まで同じ経路を通ります。

The Gemini API key is optional: Irodori and Qwen work without it. The first-node button opens a session-only key dialog and closes it after verification; the key is never written to the workflow, output JSON or logs. AI consultation considers Gemini only while a key is registered. / Gemini APIキーは任意です。Irodori・Qwenだけを使う場合は登録不要です。最初のノードのボタンからセッション限定の入力窓を開き、認証後は自動で閉じます。キーはワークフロー・出力JSON・ログに保存しません。AI相談では、登録中だけGeminiを候補に加えます。

Both models expose all 30 official studio voices, 20 Voice Design image presets, free-form Voice Design, existing Voice ID, and automatic or manual emotion with intensity. Empty free-form voice descriptions are stopped before an API request. / 両モデルで公式スタジオボイス30種、Voice Design用の声イメージ20プリセット、自由入力、既存Voice ID、感情の自動または種類・強さの手動設定を使えます。自由入力が空欄ならAPIへ送信しません。

The first-node controls are ordered as optional API registration, Voice settings, then AI consultation. The duplicate API button was removed from the voice dialog. / 最初のノードは、任意のAPI登録→声の確認・調整→AI相談の順です。声設定窓の重複APIボタンは削除しました。

Validation completed with automated Python/JavaScript coverage and live API generation for both Flash and Flash-Lite through the visible ComfyUI workflow. The generated MP3 files appeared in the final playback/save node. Pronunciation and delivery should still be listened to before publishing generated audio. / Python・JavaScriptの自動検査に加え、表示中のComfyUIワークフローからFlash・Flash-Liteの両方を実API生成し、生成MP3が最終の再生・保存ノードに反映されることを確認しました。生成した音声を公開する前に、発音と演技を実際に試聴してください。

Requirements: CUDA GPU for local Irodori/Qwen generation; LM Studio with `qwen/qwen3.5-9b` only for AI consultation; a Gemini API key and applicable cloud charges only when Gemini TTS is selected. / 必要環境：ローカルのIrodori・Qwen生成にCUDA GPU、AI相談を使う場合だけ `qwen/qwen3.5-9b` を含むLM Studio、Gemini TTSを選ぶ場合だけGemini APIキーとクラウド利用料金が必要です。
