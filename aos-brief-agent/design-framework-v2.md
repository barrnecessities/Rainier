# AOS Brief Generation Agent — Flow Framework (v2)

*One-page layout doc for design. Low-res outline, not final visual — the point is the shape and sequence, so design can decide type, spacing, and iconography.*

---

## 1. Posture — read this first, applies to everything below

Posture is picked **once per run**, at the very top, and it colors every layer underneath it — not just a dial on the final output. Draw it as a single horizontal scale, not a menu of buttons.

```
CREATIVE ─────────── BUSINESS ─────────── TECHNICAL / MARTECH ─────────── STRATEGIST
  the idea            the business case         feasibility                the logic chain
  (makers)          (client marketing leads)   (ops & data eng)          (planners/strategy)

                              ⬥ + one type-specific point, e.g. for Campaign:
                                MEDIA / PERFORMANCE — channels, flighting, allocation
```

Everything from Section 3 down is implicitly "as seen through whichever point on this scale is selected." Same context, same modules — this scale only changes emphasis, depth, and vocabulary.

---

## 2. Entry — how the system knows the brief type (open decision, not yet finalized)

Three candidate paths into "type known." **This is unresolved in the underlying architecture spec — show all three, don't pick a winner for design.**

```
 A) EXPLICIT SELECT        B) SYSTEM PRE-SET            C) INFERRED FROM PROMPT
 User picks from a         Type is fixed by the         User free-types an ask
 menu of 5 brief types     workflow/template in use     ("help me launch...") and
                           (e.g. this client program     the system detects which
                           always runs Campaign)          of the 5 types it is
```

All three funnel into the same next step:

---

## 3. Brief Type Determined — the pivot point

```
                    ┌───────────────────────────┐
                    │   BRIEF TYPE DETERMINED     │
                    │  Project · Strategy · Campaign │
                    │  Lifecycle/CRM · Asset/Production │
                    └─────────────┬───────────────┘
```

**This has to happen before context is assembled**, not after — each brief type asks its 8 context questions differently (e.g. Campaign's "Customer" pillar = *"who's the target and what moves them"*; Project's "Customer" pillar = *"whose outcomes does the engagement ultimately serve"*). Type isn't a filter applied at the end; it's the lens the whole intake is built through.

---

## 4. Live Data Pull — starts the moment type is known

```
        ┌─────────────────────────────────────────────────────────┐
        │  LIVE DATA PULL — scoped to the type just determined      │
        │  ───────────────────────────────────────────────────────  │
        │  USER    →  what's typed/uploaded this specific run        │
        │  CLIENT  →  uploaded reference docs                        │
        │             ⚠ open scope question — see Section 6          │
        │  AOS     →  Fn (frameworks) · De (Deloitte proprietary     │
        │             data & benchmarks) · Le (learned patterns) ·   │
        │             Ex (live external / 3rd-party feeds — social,  │
        │             syndicated, competitive, regulatory)           │
        └─────────────────────────────┬───────────────────────────┘
```

Which of the five AOS intelligence types (Fn/De/Le/Ex) actually fire, and which external feeds get queried, is itself type-scoped — a Campaign brief pulls different Deloitte benchmarks and external signals than a Lifecycle/CRM brief does.

---

## 5. Context + Narrative — the core, still one per run

```
                    ┌───────────────────────────┐
                    │   CONTEXT + NARRATIVE       │
                    │   8 pillars, phrased for     │
                    │   the type now determined    │
                    │   → written as ONE story     │
                    └─────────────┬───────────────┘
```

Still a single unified narrative, still written once — that principle from v1 doesn't change. What changes is that the pillar *questions themselves* are now shown as type-dependent, not generic.

---

## 6. Module Library — swappable, fixed list per type

```
                    ┌─────────────────────────────┐
                    │   MODULE LIBRARY (swap set)   │
                    │   [card] [card] [card] [card] │
                    └─────────────┬───────────────┘
```

Module *list* is fixed per brief type (e.g. Campaign always has the same 11 modules); posture (Section 1) reweights which ones get deepened vs. compressed. Modules are never generated independently of the Section 5 narrative.

---

## 7. QA Gate → Brief

```
                    ┌───────────────────────────┐
                    │  QA GATE  (Quality · Posture│
                    │  · Consistency) → BRIEF      │
                    └───────────────────────────┘
```

Blocking gate, unchanged from v1: fails route back for auto-revision (up to 2 attempts), then escalate to a human.

---

## Layers at a glance

| Layer | What it does | What's swappable here |
|---|---|---|
| Posture scale | Frames tone/depth for the whole run | One point on the scale, picked once |
| Entry | Establishes which brief type this run is | 3 candidate mechanisms (A/B/C) — open decision |
| Brief Type Determined | Locks in which pillar phrasing + module set apply | 5 brief types |
| Live Data Pull | Gathers USER/CLIENT/AOS input, scoped to type | Which AOS intelligence types (Fn/De/Le/Ex) and external feeds fire |
| Context + Narrative | Builds the one coherent story | Pillar question phrasing (type-specific), pillar content |
| Module Library | Projects the narrative into structured output | Which modules render, and how deep (posture-driven) |
| QA Gate | Blocks release until checks pass | N/A — fixed 3-category checklist |

---

## Open questions — flagged, not resolved

1. **Entry mechanism (Section 2):** explicit select, system pre-set, or inferred-from-prompt — all three are plausible, none chosen yet. Carried over from the underlying architecture spec, which leaves this open for both brief type and posture.
2. **Phase 1 data scope (Section 4):** is CLIENT data staying static-upload-only while AOS's External (Ex) feed goes live immediately, or do all three channels (USER/CLIENT/AOS) go live together on a later phase? This diagram assumes the former (static client uploads, live external/Deloitte data) — confirm with eng before treating it as decided.
