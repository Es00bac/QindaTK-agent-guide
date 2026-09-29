<!-- SPDX-License-Identifier: LGPL-3.0-or-later -->
# Agent partnership guide

This companion repository belongs to the Qinda projects on qinda. Fetch and
fast-forward from its hub before changing it; preserve local changes and push
work back to the hub. Use Portage for any software installation. Existing
Node, Python and FFmpeg are sufficient: this is a buildless static website.

Keep existing-vs-proposed labels accurate. This website must not connect to
live user applications or disclose private document data. `dist/engine.mjs`
is a teaching simulation with deterministic state transitions. Preserve
revisions, server-style validation, scope checking and request deduplication;
verify behavior with `node scripts/check.mjs` after changing that engine.

All files have at most 500 nonblank lines and LGPL-3.0-or-later SPDX headers.
Reused screenshot/video/sample assets preserve their original provenance.
Speech follows the user's active-session preference. The guide narrates with
the QindaTK project's persisted ElevenLabs Iago voice, with Brian for the
simulated partner. Full transcripts and captions must stay available.

Read the Sites building and hosting skills before publishing. Reuse the
`.openai/hosting.json` project ID. The site is owner-private. Validate and
push the exact source to both the qinda hub and Sites, package that revision,
then privately publish. Never store or print a Sites/ElevenLabs credential.
