<!-- SPDX-License-Identifier: LGPL-3.0-or-later -->
# Source notes for the agent partnership guide

Reviewed September 29, 2026. Claims about implemented features use the hub
versions of QindaTK `becfc7d417a92aeaeaca1d65ab3442702578284d` and
QindaOffice `a89bb2a`. Local uncommitted Office experiments are excluded.
The website itself is a local-data teaching simulation. It cannot operate a
desktop application or contact a model provider.

## Existing foundations

| Evidence | What it supports | What it does not establish |
| --- | --- | --- |
| QindaTK QML controls and accessibility support | Roles, names, state, actions, and semantic custom views | Automatic complete semantic coverage of every application |
| QindaTK CommandRegistry and related document services | Command IDs, enablement, document identity, revision, selection, validation, undo and transactions | One integrated live external agent protocol |
| QindaTK ScriptRuntime | State snapshots, allowed scripting actions, replay facilities | Universal typed office operations or an external CLI/MCP endpoint |
| QindaTK preview tools | Item dumps, JSON dumps, accessibility fixtures | Attachment to a user's existing live app window |
| Office libs/office_ai/src/document_tools.h and .cpp | snapshot, operationGuide, apply edits, EditOutcome, undo | Full typed input/output schemas or universal atomic application of all edit arrays |
| Office assistant_controller.* and decision D-058 | Per-window context, streaming/Stop, CLI/HTTP providers, qinda-edits parsing, edit summaries and undo | Outside agents automatically gaining control of an open document |
| Office libs/office_quick/src/action_model.h | Persistent per-window action IDs, enabled/visible state, trigger behavior | Argument schemas and verified typed outcomes for each action |
| Office system_one_client.* and live-notes pipeline | Jev-compatible structured questions/decisions in live notes | A general-purpose GUI control agent |

### Document operation coverage

- **QindaCalc — apps/qindacalc/src/calc_tools.cpp:** active-sheet snapshot,
  cell inputs and formula results, set_cells, set_range, clear, undo. The
  existing bulk AI input path skips data-validation prompts; the new bridge
  should perform server-side validation explicitly.
- **QindaWrite — apps/qindawrite/src/write_tools.cpp:** replace_document,
  replace_section, replace_text, insert, replace_selection. Markdown section
  replacement can lose custom formatting. Targeted replace_text preserves
  surrounding formatting.
- **QindaShow — apps/qindashow/src/show_tools.cpp:** set_text, add_slide,
  delete_slide, move_slide, set_notes. Snapshot slide numbers map internally
  to slide identities; numbers alone are not durable external IDs.
- **QindaNote — apps/qindanote/src/note_tools.cpp:** replace_block,
  delete_block, insert_block, replace_page, rename_page. Current page snapshot
  block numbers map internally to block identities. Preserve images/ink and
  per-document ownership when adapting this path.

Office owns each document in its ordinary top-level window. Desktop grouping,
tabs and splits belong to the compositor, not an app-wide document switcher.
The bridge should preserve that ownership and adapt the existing ActionModel,
rather than assume it is the same class as QindaTK's CommandRegistry.

An external desktop AT-SPI fixture probe read QindaTK semantic grid, canvas,
timeline and offscreen nodes. Invoking the Intro action changed the fixture
value to 2 and created one undo step. This demonstrated one real accessibility
route. It did not prove complete office-domain or external-agent coverage.

## Proposed work, clearly labelled in the site

`Tk.AgentHost`, `qinda-agent`, the typed JSON examples, result receipts,
request deduplication, consistent grants, general revision conflict handling,
the shared CLI/API/MCP contract and coordinated cross-app journey are design
proposals. They are not installed features in the reviewed revisions.

The simulation implements these proposed behaviors locally to teach them.
Its document IDs and revisions are fictional. Its validation rule of 1–10
lighting packages is a demonstration rule, not a current Office constraint.
Its atomic two-edit Note operation is local to this example; existing
DocumentTools may report both successful edits and errors. Do not generalize
that simulation to an all-or-nothing multi-document transaction.

The estimates assume one experienced Qt developer and reuse of current
document engines: roughly 1–2 weeks for a Calc vertical slice, 4–8 weeks total
for a reusable Linux service and initial adapters, further months for deeper
domain coverage or other platforms. These are engineering judgments, not
benchmarked delivery commitments.

## Primary external references

- [Qt Quick Accessible](https://doc.qt.io/qt-6/qml-qtquick-accessible.html)
- [MCP tools](https://modelcontextprotocol.io/specification/2025-11-25/server/tools)
- [MCP resources](https://modelcontextprotocol.io/specification/2025-11-25/server/resources)
- [TypeSafe / Jev Choice](https://docs.typesafe.ai/primitives/choice)
- [TypeSafe state](https://docs.typesafe.ai/concepts/state)
- [ElevenLabs text-to-speech](https://elevenlabs.io/docs/api-reference/text-to-speech/convert)

## Media provenance

Screenshots, the recorded film's picture track, and the downloadable fictional
Signal Garden project files come from the `container-wm` QindaQt desktop
showcase (`website/assets/`), branch `showcase/desktop-office-site`. Its README
describes isolated capture of installed applications using fictional public
documents. The source sample script is `website/scripts/build-office-sample.py`.
No private user documents were captured for this guide.

Reused media retain the showcase's GPL-3.0-or-later provenance. The film's
original Kokoro audio was removed; new ElevenLabs narration was generated for
this guide, divided across the matching app segments. Captions describe the
new narration. The footage predates the proposed agent service.

Budget assumptions match the sample: lighting 1 × $2,250; artist fees 4 × $650;
access $850; weather cover $900; promotion $600; meals 24 × $18. Planned total
is $7,632, revenue $10,120, balance $2,488, ceiling $8,600. Lighting quantity 2
changes planned total to $9,882 and balance to $238, $1,282 over the ceiling.

New chapter narration uses ElevenLabs **Iago — Neutral and Reliable**, the
persisted random voice for the QindaTK project. Simulated partner outcomes use
ElevenLabs **Brian**. Voice generation used the account's existing remote
helper; credentials are not included in this website or its source. Transcripts
are in narration.mjs and available in the persistent website player.

New guide code and text: LGPL-3.0-or-later. Functional diagrams and browser UI
simulations are authored HTML/CSS. They are labelled concepts, not screenshots
of a completed agent integration.
