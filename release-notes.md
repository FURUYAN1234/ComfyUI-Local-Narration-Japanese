# v1.2.1 — Voice gender choices / 声の性別選択

Manual Voice settings and AI consultation now offer Auto, Female, Male and Any. Qwen's nine built-in speakers and Gemini's 30 studio voices are grouped by gender; the voice-design menus follow the same selection. Any shows both groups, while Auto lets AI choose or follows an explicit tone in manual settings. / 手動の声設定とAI相談に「自動・女性・男性・任意」を追加しました。Qwenの既定9話者とGeminiの公式30声を性別別に整理し、声イメージのメニューも同じ選択に合わせます。任意は両方を表示し、自動はAIの提案または手動設定の口調指定を参照します。

The dialog rejects an opposite-gender tone or AI proposal. A saved Voice ID or reference recording retains its own voice. Local AI consultation now allows more time for slow responses. / 性別と矛盾する口調やAI提案は採用前に拒否します。保存済みVoice IDや参照音声は、その音声自体の声を使用します。時間のかかるローカルAI相談は応答待ち上限を延長しました。

The normal ComfyUI path completed short Qwen MP3 outputs with a male and a female built-in speaker. Manual choices and automatic AI consultation were also verified in the live interface. Audible delivery and pronunciation were not assessed. / ComfyUIの通常経路で、Qwenの男女それぞれの既定話者による短いMP3出力まで確認しました。手動選択とAI相談の自動選択も実画面で検証しています。声の聴感・発音品質は未評価です。

The optional Gemini engines from v1.2.0 remain available and still require a user-provided API key; local Irodori/Qwen does not. The API key stays in process memory and is not included in the workflow or ZIP. / v1.2.0で追加したGeminiは任意のままで、使用時だけAPIキーが必要です。ローカルのIrodori・Qwenには不要です。APIキーはプロセスメモリにだけ保持し、ワークフローやZIPには含めません。

# v1.2.0 — Optional Gemini TTS / Gemini TTSの任意選択

Gemini 3.8 Flash TTS and Flash-Lite TTS are now optional engines in the same ComfyUI narration workflow as local Irodori and Qwen3-TTS. Both Gemini engines use the normal adopted-script, mandatory reading-review, generation and final playback/save path. / Gemini 3.8 Flash TTSとFlash-Lite TTSを、ローカルのIrodori・Qwen3-TTSと同じComfyUIナレーションワークフローで任意選択できるようにしました。どちらのGeminiも、採用済み原稿、必須の読み確認、音声生成、最終ノードの再生・保存まで同じ経路を通ります。

The Gemini API key is optional: Irodori and Qwen work without it. The first-node button opens a session-only key dialog and closes it after verification; the key is never written to the workflow, output JSON or logs. AI consultation considers Gemini only while a key is registered. / Gemini APIキーは任意です。Irodori・Qwenだけを使う場合は登録不要です。最初のノードのボタンからセッション限定の入力窓を開き、認証後は自動で閉じます。キーはワークフロー・出力JSON・ログに保存しません。AI相談では、登録中だけGeminiを候補に加えます。

Selecting Gemini sends narration text, voice/style instructions and generation settings to Google's API. Do not send sensitive, confidential or personal information through unpaid services; data handling differs for paid services. Review the current Gemini API terms before use. / Geminiを選ぶと、原稿・声や口調の指示・生成設定がGoogleのAPIへ送信されます。機密情報・個人情報を無償サービスへ送らないでください。有償サービスではデータの扱いが異なるため、利用前に最新のGemini API規約を確認してください。

Both models expose all 30 official studio voices, 20 Voice Design image presets, free-form Voice Design, existing Voice ID, and automatic or manual emotion with intensity. Empty free-form voice descriptions are stopped before an API request. / 両モデルで公式スタジオボイス30種、Voice Design用の声イメージ20プリセット、自由入力、既存Voice ID、感情の自動または種類・強さの手動設定を使えます。自由入力が空欄ならAPIへ送信しません。

The first-node controls are ordered as optional API registration, Voice settings, then AI consultation. The duplicate API button was removed from the voice dialog. / 最初のノードは、任意のAPI登録→声の確認・調整→AI相談の順です。声設定窓の重複APIボタンは削除しました。

Validation completed with automated Python/JavaScript coverage and live API generation for both Flash and Flash-Lite through the visible ComfyUI workflow. The generated MP3 files appeared in the final playback/save node. Pronunciation and delivery should still be listened to before publishing generated audio. / Python・JavaScriptの自動検査に加え、表示中のComfyUIワークフローからFlash・Flash-Liteの両方を実API生成し、生成MP3が最終の再生・保存ノードに反映されることを確認しました。生成した音声を公開する前に、発音と演技を実際に試聴してください。

Requirements: CUDA GPU for local Irodori/Qwen generation; LM Studio with `qwen/qwen3.5-9b` only for AI consultation; and a Gemini API key only when Gemini TTS is selected. Gemini cloud charges may apply. / 必要環境：ローカルのIrodori・Qwen生成にCUDA GPU、AI相談を使う場合だけ `qwen/qwen3.5-9b` を含むLM Studio、Gemini TTSを選ぶ場合だけGemini APIキーが必要です。Geminiのクラウド利用料金が発生する場合があります。
