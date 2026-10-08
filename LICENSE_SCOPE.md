# License scope and existing permissions / ライセンス適用範囲と既存の許諾

Documentation revision / 文書改定: 2026-10-08. Software baseline / ソフトウェア基準: **Local Narration v1.2.6**, commit `2641621a9ebe340207bd96e59b5950a45d47cf6d`.

This document clarifies rights; it does not replace [LICENSE](LICENSE), impose additional restrictions on existing software, change version numbers or republish ZIPs. / 本書は権利の説明です。[LICENSE](LICENSE)を置き換えず、既存ソフトウェアへ独自制限を加えず、版番号変更やZIP再公開も行いません。

| Scope / 対象 | Rights and applicable terms / 権利と適用条件 |
|---|---|
| Current code and workflow / 現行コード・ワークフロー | Apache-2.0 for the integration code and distributed workflow. / 連携コードと配布ワークフローはApache-2.0。 |
| Rights holders / 権利者 | FURU/FURUYAN1234 integration contributions; Irodori, Qwen, codec/watermark authors and Gemini/ElevenLabs providers retain their own rights. / 連携部分はFURU/FURUYAN1234。Irodori・Qwen・コーデック・透かしの作者、Gemini・ElevenLabs提供者はそれぞれの権利を保持。 |
| Third-party models and services / 第三者モデル・サービス | Model-specific and codec/watermark licenses, reference voice rights, and Gemini/ElevenLabs fees and terms remain separate. / モデル別条件、コーデック・透かしの条件、参照音声の権利、Gemini・ElevenLabsの料金と条件は別途適用されます。 |
| Existing releases and ZIPs / 既存Release・ZIP | Keep the license shipped with the acquired version; no retrospective custom restrictions. / 取得した版に付属する許諾を保持し、独自制限は遡及適用しません。 |
| Custom terms target in this revision / 今回の独自条件適用対象 | None of the existing code, workflow JSONs or inherited licensed files. / 既存コード・ワークフローJSON・従前許諾のあるファイルには新規適用しません。 |

Existing MIT/GPL/Apache grants allow paid distribution and commercial use subject to their respective obligations. No additional FURU application, permission or fee is required for those licensed uses. This does not authorize a noncommercial third-party model for commercial use. / 既存のMIT・GPL・Apache許諾は、それぞれの義務を守る有料配布・商用利用を認めます。その許諾内の利用についてFURUへの追加申請・許可・利用料は不要です。第三者の非商用モデルの商用利用まで許可するものではありません。

Retain the license texts and copyright/NOTICE files that apply to each component. Modified redistribution must satisfy the respective license, including source and notice obligations where applicable. The request to display service notices does not add a new requirement to MIT/GPL/Apache-only services. / 各構成要素のライセンス本文・著作権表示・NOTICEを保持してください。改変再配布では各許諾に従い、該当する対応ソースや表示の義務を満たしてください。サービス説明ページへの表示のお願いを、MIT・GPL・Apacheだけのサービスへ追加するものではありません。

See [component/model notices](LICENSE) and [FURU usage guidance](FURU_TERMS.md). / [構成要素・モデルの条件](LICENSE)と[FURUの利用案内](FURU_TERMS.md)を参照してください。

## File-level scope / ファイルごとの範囲

| Files/components / ファイル・構成要素 | Rights and conditions / 権利・条件 |
|---|---|
| `workflows/LocalNarration_v1.2.6.json`, `custom_nodes/**`, `install.py`, root documentation / ルート文書 | FURU integration code/workflow under Apache-2.0 / FURU連携部分はApache-2.0 |
| Separately downloaded Irodori/Qwen models and codecs, Gemini/ElevenLabs APIs / 別途取得するモデル・コーデック・外部API | Their authors/providers retain their own licenses and terms / 各作者・提供元の条件を保持 |

Use per-file headers, bundled LICENSE/NOTICE files and the pinned source commit to resolve individual third-party contributions; the repository owner is not asserted to own all bundled material. / 個々の第三者寄与はファイル内表示・同梱LICENSE/NOTICE・上記ソースコミットで確認し、リポジトリ所有者が同梱物すべての権利者であるとは扱いません。
