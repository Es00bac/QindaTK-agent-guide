<!-- SPDX-License-Identifier: LGPL-3.0-or-later -->
# QindaTK agent partnership guide

A standalone, narrated interactive website explaining agent-readable native
applications and a proposed shared bridge for QindaTK and QindaOffice.
It contains real Office screenshots and recorded footage, four editable
simulations with undo, a workflow journey, a clickable architecture diagram,
and demonstrations of stale requests, read-only grants, validation and retries.

The site never connects to live applications. All interactive data is fictional.
Existing capabilities and proposed interfaces are labelled separately. The
review baseline is QindaTK `becfc7d` and QindaOffice `a89bb2a` (2026-09-29).

## Development

No package installation or build is required. Serve `dist` using an existing
HTTP server. `node scripts/check.mjs` validates the state engine and static
references. Narration text lives in `dist/narration.mjs`; the checked-in MP3s
play without an API key or model service. `node scripts/generate-audio.mjs`
uses the owner's existing remote helper on qinda to regenerate missing clips.
`node scripts/assemble-film.mjs` adds the matched narration and captions to
the recorded Office tour.

The repository hub is `qinda:~/git/QindaTK-agent-guide.git`. The Site manifest
contains its single persisted project ID; obtain fresh source credentials
through Sites when publishing, never store a credential in this repository.
Files stay below 500 nonblank lines and include LGPL SPDX headers. The reused
showcase media retain their GPL-3.0-or-later provenance; see `dist/sources.md`.
