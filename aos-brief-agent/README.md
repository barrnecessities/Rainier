# AOS Brief Generation Agent — Visual Design Mockup

A static, self-contained visual design for the AgencyOS Brief Generation Agent UI. Open `mockup.html` directly in any browser — no server, build step, or dependencies.

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
