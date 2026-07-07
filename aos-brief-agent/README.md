# AOS Brief Generation Agent

Self-contained prototypes for the AgencyOS Brief Generation Agent. Open any `.html` file directly in a browser — no server, build step, or dependencies.

## Files

| File | What it is |
|---|---|
| `demo.html` | **Working demo** — 2 brief types (Campaign, Asset/Production) × selectable postures with live re-rendering, a pizza-tracker pipeline view, a Configure panel for adding new postures/brief types, and exports (logic doc, data-sourcing map, config JSON). Dummy data behind a single `CONFIG` seam. |
| `requirements.md` | **Detailed requirements** — pipeline invariants, FR-1 to FR-9, demo-vs-production scope, acceptance criteria, open questions. |
| `mockup.html` | v1 static visual design of the five pipeline screens. |
| `design-framework-v2.md` | Slide-ready flow framework for design handoff (posture scale up top, type-first sequencing, live data pull layer). |

## Demo quick start

1. Open `demo.html`, pick a brief type + posture, hit **Generate brief** and watch the tracker walk the pipeline.
2. After the brief releases, switch posture or brief type — the brief re-renders through the new lens instantly.
3. **⚙ Configure** adds new postures/brief types (persisted to localStorage); **⇩ Export** downloads the logic/requirements doc, the internal/external/partner data-sourcing map, or the raw config JSON.

---

## Visual design mockup (v1)

## What it shows

The Campaign Brief flow (the V1 priority type) end-to-end, mirroring the architecture pipeline exactly:

1. **Intake** — brief type (5 types; Campaign active, others placeholder), posture chips, version (multi/single-channel), the ask, client reference uploads
2. **Context** — the 8-pillar context object with source-channel priority chains (CLIENT → AOS → USER) and the conditional-pillar rule demonstrated (Competitive omitted for no signal; Culture included on real signal)
3. **Narrative** — the single central story, with hoverable highlights tracing phrases back to pillars
4. **Modules** — Campaign's 11 fixed modules with pillar mappings, AOS intelligence tags (Cl/Fn/De/Le/Ex), and posture-driven deepen/compress indicators
5. **QA Gate** — the blocking Quality/Posture/Consistency checklist, with one deliberate "client to provide" failure showing the 2-retry-then-escalate behavior and a disabled Emit button

Mock content is grounded in a real brief from the corpus catalog (PayPal CBMC Day-6 Cash-to-Points opt-in).

## Data seam

Today this is visual design only. Everything dynamic renders from a single `AOS_DATA` object at the top of the `<script>` block — in the data-connected version, that object is replaced by API responses (context service, narrative service, QA service) and the render functions stay unchanged.
