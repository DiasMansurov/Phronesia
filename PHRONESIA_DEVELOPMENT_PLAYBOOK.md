# Phronesia Development Playbook

## Purpose
This file is the master development brief for all future work on **Phronesia**.
Use it as the default instruction file for future chats, product decisions, design work, technical implementation, and monetization planning.

The goal is to keep all future development aligned around one product identity, one technical direction, and one commercial strategy.

---

## Product Identity

### Product Name
**Phronesia**

### Core Pitch
Phronesia is a browser-based macroeconomics strategy game where the player runs a country, makes monetary, fiscal, and supply-side decisions, manages approval, survives elections, and competes against historical leaders.

### Product Category
- Educational strategy game
- Economics simulation
- Classroom-ready web product
- Student-first but teacher-monetizable

### Brand Personality
The brand should feel:
- powerful
- intelligent
- strategic
- slightly theatrical
- premium
- modern
- replayable

This should not feel like a worksheet, school portal, spreadsheet, or LMS.
It should feel like a **command center for ruling the economy**.

### Brand Promise
“Rule the economy. Survive the politics. Become Phronesia.”

### Tone
Copy should sound:
- bold
- sharp
- confident
- slightly dramatic
- student-friendly

Avoid:
- dry textbook phrasing
- corporate SaaS language
- childish gamification language
- generic education-app tone

---

## Brand Direction

### Visual Direction
The visual identity should communicate:
- authority
- command
- prestige
- strategy
- national power
- clarity
- focus

The player should feel like:
- head of government
- chief strategist
- ruler in a modern war room
- economic decision-maker under pressure

### Design Keywords
- throne room meets macro dashboard
- policy war room
- campaign command center
- premium strategy interface
- cinematic political simulation

### Styling Rules
- Avoid bland white dashboards.
- Avoid default startup aesthetics.
- Avoid purple-first design.
- Avoid “school software” vibes.
- Avoid overcrowded landing pages with too many simultaneous messages.
- Prefer compact layouts, short copy blocks, and obvious entry points.
- Interfaces should feel intentional and branded, not template-generated.
- Public marketing pages should feel calmer and more distilled than the in-game UI.

### Recommended Visual Language
- editorial restraint rather than visual overload
- warm neutrals with disciplined accents
- elegant serif for display typography
- modern sans for UI text
- compact cards and minimal chrome
- strong section hierarchy
- bold messaging delivered with fewer words

### Homepage Direction
The homepage should follow a compact, Apple-like reading rhythm:

- one dominant message at the top
- one primary action and one clear secondary path
- concise proof points instead of long explanatory blocks
- limited featured scenarios rather than full-content dumps
- trust surfaces visible, but lightweight
- reduced scrolling and lower cognitive load

### Typography Direction
- Display font: expressive serif
- UI/body font: clean modern sans
- Never default to Inter/Arial/system aesthetics unless forced

### Branding Line
Use some version of:
- “Rule the economy.”
- “Build your legacy.”
- “Win the second term.”
- “Become Phronesia.”

---

## Product Philosophy

### Design Principle
The product is not just an educational tool.
It is an educational game with real product ambition.

That means every feature should support one or more of:
- learning
- replayability
- status
- retention
- sharing
- monetization

### Gameplay Principle
The game should create:
- visible trade-offs
- meaningful consequences
- emotional pressure
- approval pressure
- election pressure
- replay motivation

The player should constantly feel:
- “one more run”
- “I could optimize this better”
- “I almost won reelection”
- “I want to beat that historical benchmark”

### Learning Principle
The game should stay aligned with the macroeconomics syllabus and express learning through:
- policy trade-offs
- economic outcomes
- citizen impact
- political survival
- historical comparison

It should not become overly complicated for its own sake.
Depth is good only if the player can still understand why results changed.

---

## Core Product Scope

### Current Core
- US macro presidency simulation
- 8-round structure
- reelection after round 4
- loss if approval is below threshold
- historical scenarios
- historical president comparison
- citizen-impact explanations

### Near-Term Expansion
- more eras
- more countries
- more political systems
- challenge modes
- share cards
- account system
- leaderboards
- classroom workflows

### Long-Term Expansion
- organizations / classrooms
- teacher dashboard
- tournaments / championships
- school licenses
- premium content packs
- multilingual support
- additional economics domains

---

## Technical Stack Policy

### Core Stack
- `Next.js` with App Router
- `TypeScript`
- `Vercel` for deployment
- `Supabase` for data and backend persistence
- `Clerk` for authentication and user management

### Frontend Architecture
- Use App Router only
- Prefer server-first Next.js patterns where sensible
- Keep gameplay state modular
- Keep simulation logic separate from UI
- Separate content, engine, persistence, auth, analytics, and presentation layers

### Product Architecture Modules
- `content`: scenarios, goals, difficulty, historical baselines
- `engine`: simulation logic and approval logic
- `profile`: player progression and unlocks
- `storage`: local persistence and future backend abstraction
- `analytics`: event logging
- `auth`: Clerk integration and user state
- `data`: Supabase sync and backend-facing logic

---

## Clerk Rules

### Role of Clerk
Clerk is the source of truth for:
- authentication
- sessions
- signed-in state
- user identity
- future classroom / organization identity

### Required Rules
- Use `@clerk/nextjs`
- Use App Router
- Use `proxy.ts`
- Use `clerkMiddleware()` from `@clerk/nextjs/server`
- Put `ClerkProvider` inside `<body>` in `app/layout.tsx`
- Use `Show` instead of deprecated `SignedIn` / `SignedOut`
- Use `auth()` from `@clerk/nextjs/server` with `await`

### Do Not Use
- `authMiddleware()`
- `_app.tsx`
- pages router auth patterns
- deprecated Clerk APIs
- deprecated env conventions

### Current Env Vars
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

### Auth UX Rules
- Sign-in and sign-up should be available from the top nav
- Auth should feel premium and integrated, not tacked on
- Signed-out state should invite account creation cleanly
- Signed-in state should make progress, stats, and identity feel persistent

### Future Clerk Usage
Later use Clerk for:
- user saves across devices
- streaks and badges
- rankings tied to accounts
- organizations / classrooms
- student vs teacher accounts
- school-based competition layers

---

## Supabase Rules

### Role of Supabase
Supabase is the app data layer for:
- stored runs
- rankings
- lead capture
- teacher interest
- product analytics storage
- future multiplayer / challenge data

### Supabase Principles
- Clerk handles auth identity
- Supabase handles product data
- Keep schema clean and simple
- Prefer thin API routes over leaking DB concerns into UI
- Keep future migrations easy

### Current / Expected Data Areas
- `runs`
- `leads`
- `rankings`
- `challenge_entries`
- `teacher_interest`
- future `classrooms`
- future `organization_memberships`

### Data Policy
- Keep the browser app usable with graceful fallbacks
- Use local persistence where needed for speed and resilience
- Sync key outcomes to Supabase when appropriate
- Avoid tightly coupling the UI to database implementation details

### Backend Strategy
- API routes should be thin
- DB writes should be validated
- auth-aware routes should later connect Clerk identity to Supabase records
- schema should support future account-based leaderboards and teacher dashboards

---

## CSS and UI Rules

### General CSS Policy
The UI must look premium, not generic.

### Must-Haves
- reusable design tokens
- CSS variables for colors, spacing, radius, motion
- strong hover and focus states
- responsive layout
- accessible contrast
- reduced-motion safety where appropriate

### Layout Direction
- cinematic hero sections
- immersive control panels
- layered cards
- strong spacing rhythm
- visual hierarchy that makes the game readable instantly

### Motion Direction
Use motion intentionally:
- page reveal
- score transitions
- policy feedback
- result transitions
- badge / unlock moments

Avoid noisy animation and random motion.

### Accessibility Rules
- keyboard-friendly controls
- visible focus states
- acceptable contrast
- mobile usability
- avoid motion-only meaning

### UI Feel
Every major screen should feel like:
- a place
- a system
- a command interface

Not just:
- a form
- a dashboard
- a stack of cards

---

## Product Development Strategy

### Strategic Goal
Build Phronesia into a premium educational game brand with both student demand and school monetization.

### Development Order

#### Phase 1: Strong Core Game
Focus on:
- tight gameplay loop
- clear policy consequences
- strong branding
- stable web experience
- account-ready architecture

#### Phase 2: Retention and Replayability
Add:
- persistent profiles
- badges
- scenario unlocks
- daily and weekly challenges
- better result cards
- shareable outcomes

#### Phase 3: Monetization Infrastructure
Add:
- premium campaign gating
- teacher landing flow
- waitlists and lead capture
- account-linked progress
- rankings and public challenge boards

#### Phase 4: Classroom Productization
Add:
- teacher mode
- assignment workflows
- classroom dashboards
- per-student reporting
- curriculum-aligned debrief materials

#### Phase 5: Competitive Ecosystem
Add:
- official leaderboards
- seasonal challenges
- verified tournaments
- school competitions
- live championship infrastructure

### Feature Prioritization Rule
Prioritize features that sit at the intersection of:
- replayability
- educational value
- monetization potential

If a feature is interesting but adds complexity without helping these three goals, deprioritize it.

---

## Monetization Strategy

### Main Business Model
Hybrid:
- B2C student premium
- B2B teacher / school product

### Revenue Layer 1: Teacher and School Sales
Sell:
- teacher license
- department license
- school-wide license

Package:
- classroom-ready game access
- lesson plans
- debrief materials
- worksheets
- answer guidance
- assessment rubrics

### Revenue Layer 2: Student Premium
Free core:
- starter scenarios
- base gameplay
- basic result card

Premium:
- more scenarios
- more historical periods
- more countries
- tougher challenge modes
- richer analytics
- cosmetic profile prestige
- deeper campaign paths

### Revenue Layer 3: Competition
Future monetization through:
- tournament entry
- sponsored challenges
- school team competitions
- premium ranked seasons

### Revenue Layer 4: Partnerships
Potential future partners:
- tutoring companies
- economics creators
- revision platforms
- universities
- school networks

---

## Go-To-Market Strategy

### Primary Initial Audience
- IB DP Economics students
- IB DP Economics teachers

### Secondary Audiences
- AP Macroeconomics
- IGCSE Economics
- A-Level Economics
- general econ learners

### Core Distribution Channels
- teacher outreach
- economics teacher communities
- Reddit
- YouTube creators
- teacher-facing landing pages
- school email campaigns
- social proof via scorecards and gameplay clips

### Marketing Message
Do not market this as “an educational website.”
Market it as:
- “a macro strategy game”
- “an economics leadership simulator”
- “a political survival and policy game”

### Best Hooks
- Can you survive reelection?
- Can you beat historical presidents?
- Can you master inflation without losing the public?
- Can you become Phronesia?

---

## Product Experience Strategy

### What Makes the Game Sticky
- historical comparison
- approval pressure
- reelection pressure
- visible trade-offs
- clear failure states
- prestige titles
- replayable challenges
- score optimization

### What Makes It Shareable
- result cards
- historical comparison
- public rank
- “closest president” result
- challenge mode outcomes

### What Makes It Monetizable
- locked but visible content
- strong core loop
- identity and progression
- classroom utility
- repeat play

---

## Future Roadmap Rules

### Countries and Systems
When expanding, each new country should not be only cosmetic.
It should change the game logic meaningfully through:
- political system
- election structure
- exchange-rate regime
- macro vulnerabilities
- policy constraints

### Difficulty Progression
Difficulty should come from:
- tighter approval margin
- harder inflation control
- debt pressure
- more unstable starting conditions
- stricter reelection conditions

Not from random unfairness.

### Event Design Rule
If events are used in future versions, they must:
- support syllabus logic
- create strategy, not chaos
- remain interpretable

Randomness should not overpower policy.

---

## Writing Rules for Future Development

### UI Copy
Use short, punchy copy.
Prefer:
- “Hold approval”
- “Win a second term”
- “Stabilize inflation”
- “Protect households”
- “Build your legacy”

### Avoid
- textbook paragraphs inside UI
- bureaucratic wording
- generic startup copy
- overly cute language

### Student-Facing Language
Explanations should be:
- clear
- direct
- game-like
- syllabus-aligned

Citizen impact language should explain:
- prices
- jobs
- household pressure
- inequality
- confidence

---

## Non-Negotiables

Always protect:
- brand coherence
- replayability
- educational clarity
- technical maintainability
- monetization runway

Do not allow the product to drift into:
- boring school software
- overcomplicated econ math with poor UX
- generic SaaS dashboard UI
- monetization spam
- random unstructured feature creep

---

## Default Build Instruction for Future Chats

When using this file in future chats, assume:
- the product name is **Phronesia**
- the experience should feel premium, strategic, and ruler-like
- the stack is `Next.js + TypeScript + Clerk + Supabase + Vercel`
- auth should use modern Clerk App Router patterns
- UI should be premium and branded
- gameplay should be replayable and monetizable
- all work should support long-term growth into a serious educational game business

---

## Short Internal Summary

Build **Phronesia** as a premium macro strategy game that:
- teaches macroeconomics through decisions and consequences
- feels like ruling a country, not filling a worksheet
- is strong enough for students to replay
- useful enough for teachers to assign
- structured enough to monetize through premium content and school licensing
