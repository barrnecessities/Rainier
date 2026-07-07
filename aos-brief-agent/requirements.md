# AOS Brief Generation Agent — Detailed Requirements

**Companion to:** `demo.html` (working demo, dummy data) · `mockup.html` (v1 visual design) · `design-framework-v2.md` (flow framework)
**Status:** Draft for team review. The demo implements FR-1 through FR-8 with dummy data; data-connected behavior is specified but not built.

---

## 1. Product summary

The Brief Generation Agent turns inconsistent client inputs into consistent, high-quality marketing briefs. One shared pipeline serves multiple brief types; a selectable posture reweights the same underlying content for different readers; a blocking QA gate guarantees coherence before release.

**Core value proposition:** bring consistency to inconsistent client data inputs. Positioned as the front door to AgencyOS — briefing is the entry point that unlocks downstream workflow adoption.

**Competitive grounding (from landscape research, July 2026):** no competitor found (Jasper, Adobe GenStudio/Firefly, Salesforce Agentforce, Microsoft Copilot brief agent, Omneky, Foreplay, Uplifted) combines: narrative-first generation, a persistent posture layer, prioritized multi-source data with claim-level traceability, a blocking cross-module consistency gate, and multiple brief types on one architecture. Each element individually is rare; the combination is absent.

---

## 2. The pipeline (system behavior)

```
Intake → Live Data Pull → Context (8 pillars) → Narrative → Modules → QA Gate → Brief
```

Invariant rules (these are the architecture — violating any of them is a defect, not a style choice):

1. **Type first.** Brief type must be determined before context assembly. Each type phrases the 8 pillar questions differently and scopes which data gets pulled.
2. **Narrative first.** One story is written across all populated pillars before any module exists. Modules are projections of the narrative, never independently generated.
3. **Posture reweights, never restructures.** One posture per run. It changes emphasis, depth, vocabulary — the type's module list is fixed.
4. **Conditional pillars are honest.** Competitive and Culture appear only on real signal — never thin filler.
5. **Nothing fabricated.** Every claim, figure, and date traces to a named input (USER, CLIENT, or AOS). Mandatories, legal constraints, and the confirmed objective are never inferred.
6. **QA blocks.** Failed checks trigger auto-revision (max 2 attempts), then escalation to a human with the failed checks attached. Only a fully passing scan releases the brief.

---

## 3. Functional requirements

### FR-1 — Entry & intake
- FR-1.1: User selects brief type and posture, states the ask, and attaches client reference documents.
- FR-1.2 *(open decision)*: three candidate entry mechanisms — (A) explicit select, (B) system pre-set by template/workflow, (C) inferred from a free-text prompt. Demo implements (A); the config schema must not preclude (B) or (C).
- FR-1.3: Posture defaults per brief type (e.g. Campaign → Media/Performance) so posture is pre-filled and discoverable rather than mandatory friction. *(From competitive research: no user expects a posture concept; don't make them pay for it at intake.)*

### FR-2 — Live data pull
- FR-2.1: The moment type is known, the system pulls from the three channels, scoped to what that type needs:
  - **USER** — this run's ask, uploads, and overrides.
  - **CLIENT** — uploaded reference documents (Phase 1: static uploads only; persistent client profile is a later phase).
  - **AOS** — the intelligence layer: **Fn** (functional frameworks), **De** (Deloitte proprietary data/benchmarks), **Le** (learned patterns from prior runs), **Ex** (external/3rd-party feeds).
- FR-2.2: Source priority order per pillar is explicit and configurable (e.g. Customer: CLIENT → AOS → USER).
- FR-2.3 *(open decision)*: whether AOS·Ex external feeds are live in Phase 1 while CLIENT stays static — confirm with engineering.

### FR-3 — Context assembly
- FR-3.1: 8 pillars, phrased per brief type: Customer, Company, Competitive○, Culture○, Opportunity, Assignment, Mandatories, Considerations.
- FR-3.2: Conditional pillars (○) are populated on signal or explicitly omitted with the reason recorded.
- FR-3.3: Missing mandatory inputs block progression and generate a specific request to the user.

### FR-4 — Narrative generation
- FR-4.1: One unified narrative across all populated pillars, generated before modularization.
- FR-4.2: Narrative resolves contradictions between inputs and flags (not silently fixes) weak or conflicting client inputs.
- FR-4.3: Narrative segments carry pillar provenance (which pillar fed which passage) for UI traceability.

### FR-5 — Module projection
- FR-5.1: Each brief type has a fixed, ordered module set (Campaign: 11; Asset/Production: 11; others per architecture doc §7).
- FR-5.2: Posture weighting maps declare, per type × posture, which modules deepen and which compress.
- FR-5.3: Modules carry: source pillars, AOS intelligence tags (Cl/Fn/De/Le/Ex), base content, and optional per-posture content variants.
- FR-5.4: **Live re-rendering:** switching posture (or type) after generation re-renders the brief from the same narrative without a full regeneration. This is the demo's core interaction and the product's key differentiator — same content, different lens, instantly.

### FR-6 — QA gate
- FR-6.1: Three check categories — Quality (complete/grounded), Posture (lens applied, no drift), Consistency (numbers reconcile, no cross-module contradiction).
- FR-6.2: Blocking: any failure prevents release. Auto-revise up to 2 attempts, then escalate to a human reviewer with failed checks attached.
- FR-6.3: Genuine input gaps are released as explicit "client to provide" flags, not silently filled.
- FR-6.4 *(from competitive research)*: design the reviewer-facing escalation view (who receives it, what they see) — competitors ship human-in-the-loop approval with audit trails as table stakes; our gate needs a receiving surface, not just a sending rule.
- FR-6.5 *(from competitive research)*: after any manual edit to one module, consistency re-checks run and surface — this is the moment users lose trust in every competitor ("generic output requiring heavy editing").

### FR-7 — Configurability
- FR-7.1: Brief types and postures are config, not code. Adding either requires no pipeline changes.
- FR-7.2: A new posture declares: name, reader, lens description, and deepen/compress rules (by module-name match until per-type maps are authored).
- FR-7.3: A new brief type declares: name, description, module list; it runs immediately with placeholder content and a default pillar set, upgradeable to full authored content later.
- FR-7.4: Custom additions are exportable alongside the base config (single JSON contract for engineering).

### FR-8 — Export
- FR-8.1: **Logic & requirements export (.md)** — pipeline rules, all types, postures, module maps, and QA checks, generated from the live config (including custom additions).
- FR-8.2: **Data sourcing map export (.md)** — per brief type, a table of what to source **internally**, **externally (3rd-party)**, and **from partners** — circulate as the data-collection ask.
- FR-8.3: **Config export (.json)** — the machine-readable contract engineering wires real data behind.

### FR-9 — Progress visibility ("pizza tracker")
- FR-9.1: A persistent stage tracker shows the seven pipeline stages; the active stage pulses, completed stages check off, each stage streams a short log of what it did (documents parsed, benchmarks loaded, checks passed).
- FR-9.2: A Help overlay explains each stage and how to use the tool in ≤5 steps.
- FR-9.3 *(from competitive research)*: users tolerate a multi-stage pipeline over one-shot generation only if value visibly accrues per stage — the tracker is a trust device, not decoration. A future "fast mode" may run stages silently and surface only the QA gate.

---

## 4. Data traceability (claim-level grounding)

From competitive research: Jasper's most-repeated selling point is knowledge-base grounding; Adobe's is a continuously-learning brand layer. Our answer must go one level deeper:

- Every figure, date, and claim in an emitted brief carries a source reference (document name, AOS layer tag, or user-ask citation).
- The UI exposes this on hover/footnote — always visible, not buried in the QA report.
- The learned layer (Le) captures implicit signals — QA escalation outcomes, post-emit edits, approval annotations — one capture pipe feeding future runs.

---

## 5. Non-goals (this phase)

- No downstream execution (creative production, media buying, journey orchestration). Briefs export in structured Markdown/JSON so downstream tools (e.g. Adobe Firefly Creative Production, which consumes briefs as workflow input) can pick them up.
- No live CRM/CDP integration for client data (static uploads only in Phase 1).
- No multi-posture simultaneous output (one lens per run; re-render to switch).
- No auto-detection of brief type from a prompt (entry path C) — schema-supported, not built.

---

## 6. Demo scope vs. production scope

| Capability | Demo (`demo.html`) | Production |
|---|---|---|
| Brief types | Campaign + Asset/Production, fully authored; custom types via config panel | All 5 types per architecture doc §7 |
| Postures | 4 base + 2 type-specific; Creative and Media/Performance (Campaign) and Production/Trafficking (Asset) carry authored content variants | All postures carry authored weighting maps per type |
| Data | Single in-file `CONFIG` object (the data seam) | Context/narrative/QA services; config becomes the API contract |
| Narrative | Pre-authored per type | Generated from assembled context, pillar-provenance tagged |
| QA gate | Simulated pass with one auto-revision shown | Real checks, blocking, 2-retry-then-escalate |
| Persistence | localStorage for custom config | Versioned config store, client profiles |
| Export | Client-side .md/.json downloads | Same formats, server-generated, plus structured brief export |

---

## 7. Acceptance criteria (demo)

- Generate works for both brief types and all selectable postures without errors.
- Switching posture after generation re-renders the brief instantly; deepened/compressed badges and content variants visibly change.
- Switching brief type after generation re-renders with that type's module set and project content.
- Tracker walks all seven stages with per-stage logs; Help overlay explains the flow.
- Configure panel: a new posture and a new brief type each appear in the pickers and generate immediately with placeholders; Reset removes them.
- All three exports download and reflect custom additions.

## 8. Open questions (carried, unresolved)

1. Entry mechanism: explicit select vs. pre-set vs. inferred (FR-1.2).
2. Phase 1 data scope: live AOS·Ex feeds vs. all-static (FR-2.3).
3. Escalation routing: who is the human Worker, and in what tool do they review (FR-6.4)?
4. Fast mode: one-click silent pipeline with QA-only surfacing (FR-9.3) — V1 or later?
5. Governance: who approves new postures/brief types added via config?
