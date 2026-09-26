# v1.2.3 — Voice settings and reading dictionary / 声設定と読み辞書

In Voice settings, choosing Female or Male now updates an opposite-gender term in a custom tone description while preserving the other wording. Apply also corrects a clear mismatch already present in the dialog, saves the selected voice settings and closes it. An instruction mentioning both male and female still requires manual correction. / 声設定で「女性」「男性」を選ぶと、自由入力に残った逆の性別語だけを更新し、ほかの口調を保持します。既に食い違っている場合も、明確に一方の性別だけなら「採用」で整合して保存し、ダイアログを閉じます。男女が混在する指示は手動で修正してください。

The reading review now includes a private user dictionary for word-to-hiragana corrections. Add, edit or delete entries in the review dialog; new conversions reuse them across sentences. An entry updates a current suggestion only if that row has not been manually edited. Dictionary files stay outside the workflow and ZIP. / 読み確認に非公開の単語→ひらがな辞書を追加しました。確認窓で登録・編集・削除でき、別の文の変換にも再利用します。開いている確認窓では、手修正していない行だけ候補を更新します。辞書ファイルはワークフローやZIPに含めません。

The live ComfyUI dialog and the saved workflow were checked with a female Gemini studio voice and a custom tone; regression tests cover the former mismatch, gender switching and ambiguous instructions. Audio quality was not reassessed for this UI fix. / Geminiの女性公式ボイスと自由入力の口調で、ComfyUIの実画面とワークフロー保存を確認しました。旧来の食い違い、性別切替、曖昧な指示を回帰テストで確認しています。この画面修正で音声の聴感品質は再評価していません。

The sentence-edit button in the first node now has vertically centered text, removing the excess-looking space above its label. / 最初のノードの「台詞を1文ずつ編集」ボタンは文字を縦中央に配置し、上側の空きが目立たないようにしました。
