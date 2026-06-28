# Armored Focus — Behavior Specification

This document is the build target for the SvelteKit + Cloudflare rewrite. It captures
the behavior of the original single-file React prototype
(`Armored Focus Prototype Code File V1.jsx`, 2,161 lines) so the new app can "look the
same and handle the same" without referencing the old code.

> Source of truth: the original prototype is preserved in git history (branch `main`,
> file `Armored Focus Prototype Code File V1.jsx`).

---

## 0. What's faithful reproduction vs. genuinely new

| Area | Status in prototype | Plan for rewrite |
|---|---|---|
| Screens, components, RPG theme, visuals | Fully present | **Reproduce faithfully** |
| Game rules / XP / quests / multipliers | Present (some bugs) | **Reproduce as functional core + unit tests**; fix the clear bugs in §9 deliberately |
| Persistence | **None** (state lost on refresh) | **New** — Cloudflare D1 (SQL), single-user |
| Auth / accounts | **None** (just an editable name) | **Deferred** — no login for now; schema keeps a `user` row so auth can be added later without migration |
| Level-up trigger | **Missing** (exp accrues, level never increments) | **New/fixed** — implement real level-up |
| Currency / coins | Iconography only, no system | **Exp-only** (match prototype) — no coins in v1 |

---

## 1. App Overview

**Armored Focus** is a **gamified CRM / productivity app for an insurance agent**, wrapping
real sales/CRM activity (contacting clients, quoting policies, follow-ups, service tasks)
in a **medieval-RPG fantasy metaphor**.

- Clients/prospects = collectible **Cards** kept in a **Binder** ("Repository of Known Associates")
- Tasks/activities = **Quests** (XP rewards, due dates, completion outcomes)
- The agent = a leveling **hero/knight** ("Drew Leui" default) earning **Exp** and **Levels/Titles**
- Activity history = **"Today's Scroll"** / "Grand Archive of Deeds"
- Bulk client import = **"Booster Pack"** (CSV)
- Combining duplicate cards = **Merge**

**Core loop:** Draw cards (add clients) → start quests on them → complete/continue quests →
earn Exp (modified by multipliers/bonuses) → level up.

| RPG term | Real meaning |
|---|---|
| Card | Client / prospect / business contact |
| Binder | Client database |
| Quest | A task/activity (quote, meeting, follow-up, service) |
| Exp | Points/score earned for activity |
| Booster Pack | CSV import of contacts |
| Standalone Quest | One-off task not tied to a client |
| Cooldown | A waiting period before a quest can resume |
| COI / BNI | Center of Influence / BNI networking member flags |

---

## 2. Screens / Views

Top **tab bar**: **Hub, Quests, Binder, Rules**. Each tab has its own color theme (§7);
body background and header border change per active tab.

### 2.1 Hub (default)
Retro-blue "RPG file-select" dashboard. 12-col grid: left col-span-4, right col-span-8.

- **File-Select Header panel:** big **Level** number, editable **player name** (click to edit
  inline, blur/Enter to save), **Exp bar** (`{currentExp} Exp` / `Next: {maxExp}`, glowing
  fill at `percent%`, `{remaining} Exp UNTIL LEVEL UP`).
- **Action buttons (stacked):** "Start Card Quest" (green), "Start Standalone Quest" (purple,
  opens Start Quest modal standalone), "Draw New Card" (gold, opens Draw Card modal).
- **"Per Hit Rate" panel:** "Targeted $0" / "Idle $0" (was a hardcoded placeholder — see §9).
- **Bonus Board panel:** renders `rules.bonuses`; each shows name, progress bar, `{current}/{required}`.
- **Right column:** "Active Quests" + current date badge; lists client cards having at least one
  Active/Cooldown quest. Empty: "The Quest Board is Empty".

### 2.2 Quests
Fantasy-map theme (emerald). Left 1/4 sidebar + right 3/4 quest tray.

- **Sidebar:** Search box ("Search Quests..."), "Start Card Quest", "Start Standalone Quest"
  (purple), "Explore for Quests" (blue), and the **ScrollLog** ("Today's Scroll").
- **Tray:** scrollable list of client cards with Active/Cooldown quests. Empty:
  "No Active Quests / The realm is quiet... for now."

### 2.3 Binder
Pink→purple binder theme with decorative 3-ring spine. "The Binder / Repository of Known Associates".

- Buttons: **"Add Booster Pack"** (CSV import wizard), **"Draw New Card"**.
- **Search + Sort bar:** search input ("Search by Name, Phone, Address...") and Sort dropdown.
- Lists ALL cards (standalone filtered out). Empty: "Binder Empty / No cards collected yet."

### 2.4 Rules
Parchment-themed config screen. Two-column grid of editable rule sections + a Level Progression
table. Add/edit/delete all game rules (§4). "Edit Table" opens the Level Table modal.

### 2.5 Modals (overlays)
1. **Draw Card** — create new client/business card
2. **Booster Pack** — CSV import wizard
3. **Level Table** — edit levels & universal rewards
4. **Start Quest** — start card or standalone quest
5. **Quest Result** — Complete or Continue a quest (completion type, commission, next step, note)
6. **Merge Cards** — merge another card into the selected one
7. ~~modifyQuest~~ — flag exists but **no modal implemented** (§9) → design fresh

---

## 3. Components

- **RPGButton** — variants: `primary` (brown), `action` (green), `danger` (red), `gold`;
  metallic shadow/font, active-scale, hover-brightness, disabled opacity.
- **RelationshipBar** — `score` clamped 1–100; red→yellow→green gradient
  (`#ef4444`→`#eab308`→`#22c55e`) with tick marks every 10%.
- **CooldownBar** — `daysRemaining` over `totalDays=7`; fills from right, blue→pink
  (`#3b82f6`→`#ec4899`); "CONVERTS TOMORROW" at ≤0, pulsing overlay at ===1.
- **ScrollLog** — parchment scroll. Collapsed = "Today's Scroll" (today's entries only).
  Expanded (fullscreen) = "Grand Archive of Deeds" with search over clientName/questType/note.
  Each entry: client name, date, quest type (italic), `+{exp} XP` badge (if exp>0), note.
  Empty: "The scroll is blank...".
- **RuleSection** — editable rule rows (name input, numeric value input reading
  value/exp/bonusPercent/reward, unit label, delete) + "+ Add".
- **ClientCard** — the central complex component (collapsed row + expanded full card); see §3.1.
- **Header tab bar** — `[Hub, Quests, Binder, Rules]` with per-tab active styling.

Icons from `lucide-react` (Shield, Scroll, Sword, Map, Users, Archive, Plus, Search, Coins,
Award, Target, Merge, …). Svelte equivalent: `lucide-svelte`.

### 3.1 ClientCard

**Collapsed (row):** 12-col grid — Name (3), Phone (2, formatted), Latest Note (3, from tracked
quest's last note), Current Quest (2), Score (1, numeric or "-" for standalone), Due (1, badge).
Floating quest-indicator dots (`!` circles colored by urgency, §4.5). Card bg/border encodes type
(§7). Click toggles expansion; expanded card auto-scrolls into view (~300ms).

**Expanded (full card):**
- Header bar: type label ("Client Card" / "Business Card" / "Standalone Quest"), **Flip Card**
  (Client↔Business face), **Set as Primary? / Primary**, **Merge**, **Edit**(pencil)/**Close**(X),
  Cancel/Save in edit mode.
- Left col (5): editable details.
  - *Client face:* Phone, DOB, Email, Address, Residence (Homeowner/Rent/Other), Line-of-Business
    checkboxes, Carriers checkboxes.
  - *Business face:* Phone, EIN, Est., Occupancy (Own/Lease/Other), Business Lines, Business Carriers.
  - COI/BNI checkboxes (edit) or badges. **Relationship Score** bar + **User Rating** slider 0–5
    (each star = +10 score). Per-side **Activity Log**.
- Right col (7): **Quest Actions**. Tabs per active quest ("1st/2nd/3rd Quest", max 3). Per quest:
  type, due date (or "On Cooldown"), Track/Tracking toggle. Cooldown quests → CooldownBar +
  Continue/Extend/Give Up. Active quests → Continue/Complete/Cancel + "Modify Quest Details".
  "Start Second/Third Quest" when 1–2 active quests exist. Empty: "No active quests… Start Quest".

---

## 4. Game Mechanics / Business Rules  ← functional core, unit-tested

### 4.1 XP / Leveling
- User stat shape: `{ name, exp, level }`, default `{ name:'Drew Leui', exp:0, level:1 }`.
- **Levels** (`rules.levels`): L1 = 0 Exp ("Novice", "Starter Pack"), L2 = 500 ("Apprentice",
  "New Sword"), L3 = 1500 ("Journeyman", "Horse"). New level added = prev exp + 1000, title "Master".
- `getExpData()`: `maxExp` = exp of level+1 (fallback **2000**). `percent = clamp(exp/maxExp*100,0..100)`.
  `remaining = max(0, maxExp - exp)`.
- **REWRITE FIX:** implement real level-up — when `exp >= nextLevelThreshold`, increment level
  (and grant universal rewards). Prototype never incremented level (§9).
- **Universal level rewards** (`rules.universalLevelRewards`): "Full Health Restore",
  "+5 to Relationship Cap" — display-only in prototype.

### 4.2 XP Earning Events
- **New Card Drawn:** +25 Exp (`rules.general` "New Card Drawn").
- **Quest completion/continuation:** `calculateFinalExp` (§4.3).
- **Exp per Commission Dollar:** 1 Exp/$ (`rules.general`).

### 4.3 Final Exp Formula — `calculateFinalExp(quest, client, sideData)`
```
totalExp = quest.baseExp
multiplierPercent = 0
daysOut = getDaysOut(quest.dueDate)
  daysOut > 0  → += Early (+15%)
  daysOut < 0  → += Late  (-15%)
  daysOut == 0 → On-Time (0%)
client.isCOI → += COI Card (+20%)
client.isBNI → += BNI Card (+25%)
carriers includes "Farmers"            → += Carrier: Farmers (+20%)
else carrier includes "Foremost"/"Bristol" → += Carrier: Foremost/Bristol West (+15%)
+= completionType.bonusPercent
totalExp = totalExp * (1 + multiplierPercent/100)
totalExp += commission * commissionRate(=1)
return Math.round(totalExp)
```
**Multipliers** (`rules.multipliers`): Early +15, On-Time 0, Late −15, COI Card +20, BNI Card +25,
Carrier: Farmers +20, Carrier: Foremost/Bristol West +15.
**Completion Types** (`rules.completionTypes`, bonusPercent): Completed 0, Won Farmers +25,
Won Farmers Life +50, Won Farmers Commercial +40, Won Non-Farmers New Business +15.

### 4.4 Quests
- **Shape:** `{ id, type, baseExp, dueDate, status, tracked, notes:[], completedDate?, completionType? }`.
- **Card quest types** (exp): Quote New–Initiated by Me 50, Quote New–Initiated by Them 25,
  Quote Existing 20, General Meeting 15, Productive Meeting 30, Follow-Up 10, Review 25, Letter 25,
  Service–Payment 20, Service–Change 20, Service–Claim 20, Service–Other 20.
- **Standalone quest types** (exp): Plan Day 15, Attend Network 15, BNI 15,
  Intentional Prospecting 25, Service Agency Client 15.
- **Statuses:** Active, Cooldown, Completed, Cancelled.
- **Max 3 active quests per side.**
- **Tracking:** exactly one quest per side is `tracked`; auto-track earliest-due if none.
- **Start** → push Active quest (+optional note), rebalance tracking, log "Quest Started" (0 exp).
- **Standalone** → temp client `isStandalone:true`, name "Standalone Task", note **required**;
  removed entirely on completion or Give Up.
- **Complete** → finalExp added to userStats.exp; log "{type} (Complete)"; standalone deleted, else
  status Completed + completedDate + completionType; rebalance.
- **Continue** → if "Put into Cooldown": status Cooldown, dueDate=nextDueDate, type+" (Cooldown)";
  else advance to next quest type (new type/exp/dueDate, Active) + note "Quest progressed to {type}".
  Exp awarded on continue too. Rebalance.
- **Cooldown actions:** Give Up → standalone deleted / else Cancelled. Extend → dueDate=new/tomorrow.
  Continue → next type (default Follow-Up exp 10), Active, dueDate=new/today; log "Quest Progressed (From Cooldown)".

### 4.5 Quest urgency colors
`getQuestColorClass`: Cooldown=blue; overdue(<0)=purple; today/tomorrow(≤1)=red; soon(<4)=yellow;
else green. Due badge: Cooldown→"Cool", ≤1→"Now", else "{n}d".

### 4.6 Relationship Score
- Per card `relationshipScore` (0–100), `userRating` (0–5). Each rating point = +10 score.
  `relationshipScore = clamp(baseScore + rating*10, 0..100)`, baseScore = prev score − oldRating*10.
- Standalone cards show "-" for score.

### 4.7 Bonus Board
- `rules.bonuses`: "Plan Day 5 Days Straight", reward 100 Exp, target 5.
- Bar = `min(100, current/required*100)`. **REWRITE:** actually increment progress + award reward
  (prototype was display-only, §9).

### 4.8 Dates / Timers
- `getDaysOut(dateStr)`: ceil days from today midnight; null→999.
- `formatDisplayDate`: 0→"Today", 1→"Tomorrow", 2–6→"Due in N Days", else MM/DD/YYYY.
- `formatDateStandard`: MM/DD/YYYY.
- Cooldown = 7-day visual timer. "Today's Scroll" filters log entries dated today.

### 4.9 Household auto-matching
`checkHouseholds` (after add/merge/import): group cards by identical `address` (len>5); shared
address → populate `connections.household`. Mostly display-only.

### 4.10 Binder sort options
`[Alphabetical(default), Due Date, Client Side, Business Side, CoI, BNI, Relationship Score,
Farmers First, Life First, Exp Earned, Commission Earned]`. (Exp/Commission Earned were identical —
§9, fix.) Due Date sorts by tracked quest dueDate (fallback 2099-12-31).

### 4.11 Coins / Currency
Iconography present but **no currency system implemented**. Commission feeds Exp only.
**Decision: Exp-only for v1** — no coins. Commission contributes Exp (1 Exp/$) as in §4.3.

---

## 5. Data Model

**Card object:**
```js
{
  id, primarySide: 'Client'|'Business'|'Standalone',
  name, address, mailingAddress, phone, email, dob, license,
  residenceType: 'Homeowner',
  userRating: 0, relationshipScore: 0, isCOI: false, isBNI: false,
  isStandalone?: boolean,
  clientSide:   { notes:[], logs:[], quests:[], lob:[], carriers:[] },
  businessSide: { businessName:'', phone:'', ein:'', established:'', occupancy:'Own',
                  notes:[], logs:[], quests:[], lob:[], carriers:[] },
  connections:  { referredBy:[], referrals:[], household:[] }
}
```
**Quest:** `{ id, type, baseExp, dueDate, status, tracked, notes:[{id,text,date}], completedDate?, completionType? }`
**Log entry:** `{ id, clientName, questType, exp, date(ISO), note? }`
**Note:** `{ id, text, date(ISO) }`
**userStats:** `{ name, exp, level }`

> These are the in-memory React shapes. For the rewrite they map to D1 tables
> (users, cards, card_sides, quests, quest_notes, activity_log, rules, bonuses) keyed by user.

---

## 6. Auth / Account  ← DEFERRED

**Decision:** no login/auth in v1. The app behaves as a single user (the editable
`userStats.name`, default "Drew Leui").

To avoid a painful migration when auth is added later, the D1 schema still includes a
`user` table and every owned row (cards, quests, rules, stats, log) carries a `user_id`
foreign key. v1 seeds and uses a single default user row. Adding login later = add a
sessions table + login routes + scope queries to the session user; no data reshape needed.

---

## 7. Visual Design

**Fonts:** `font-serif` (headers/cards), `font-sans` (body), `font-mono` (numbers/dates).
`METALLIC_FONT = serif bold tracking-wide`. `METALLIC_SHADOW = shadow-[0_4px_4px_rgba(0,0,0,.3),inset_0_1px_0_rgba(255,255,255,.5)]`.

**THEME (Parchment / global / Rules):** bg `#e8e4d9`, panel `#fdfbf7` border `#d4c5a9`,
header bg `#2c241b` text `#eebb4d`, accent `#8b4513`, gold border `#daa520`, silver `#a9a9a9`.
Buttons: primary `#5c4033→#2c241b→#1a1008` text `#f5deb3`; action `#4ade80→#2e8b57→#14532d`;
danger `#ef4444→#8b0000→#450a0a`; gold `#faeebf→#daa520→#b8860b` text `#2c241b`. Input bg `#fffef8`.

**HUB_THEME (retro blue):** bg `blue-800→slate-900` (root `slate-950`); panel `blue-900/80`
border `blue-400/40` backdrop-blur; text `blue-50`; accent `cyan-300`; bar `blue-500→cyan-400→blue-300` + cyan glow.

**QUEST_THEME (fantasy map):** bg `emerald-900→#5d534a→#3e3730`; tray `emerald-900/80` border `emerald-700/50`.

**BINDER_THEME (pink→purple):** bg `pink-900→purple-950`; page `#fdf4f8`; spine `#4c1d95`;
silver rings; accent `#e9d5ff`.

**Card type colors:** Standalone purple (`purple-100→200`, border `purple-600`); Client w/ policies
emerald (`emerald-100→200`/`600`); Client prospect stone (`stone-200→300`/`500`); Business w/ policies
blue (`blue-100→200`/`600`); Business prospect orange/amber (`orange-100→200`/`700`).
COI override `border-4 border-slate-700`; BNI override `border-4 border-yellow-500`.

**Tab glows:** Hub blue, Quests emerald, Binder pink, Rules parchment (`#d7ccc8`/`#5d4037` serif italic).
**Scroll log:** `#f5e6d3` parchment, `#8b4513` 6px border, wood-roll bars, SVG dot texture 10%.
**Layout:** sticky top tab bar (z-50), `max-w-7xl mx-auto p-6` (Quests is full-bleed),
modals `fixed inset bg-black/60 backdrop-blur z-[100]`, rounded panels with 2–4px themed borders, gap-6/8 grids.

> Tailwind is used in the prototype; carry it over to SvelteKit. The hex/utility values above
> should reproduce the look 1:1.

---

## 8. Seed / Reference Data

- **userStats default:** "Drew Leui", exp 0, level 1.
- **clients:** empty (all views start with empty states).
- **bonusProgress:** `{ 'b1': 2 }` (Plan Day at 2/5).
- **dailyLog:** empty.
- **initialRules:** general (New Card Drawn 25, Exp/Commission$ 1), 12 cardQuestTypes,
  5 standaloneQuestTypes, 5 completionTypes, 7 multipliers, 1 bonus, 3 levels, 2 universal rewards
  (exact values in §4).
- **CLIENT_LOB_OPTIONS:** Home, Auto, Toys, Umbrella, Life, Commercial, Health, Supplemental,
  Warranty, Electronics, Jewelry, Pet, Other.
- **CLIENT_CARRIER_OPTIONS:** Farmers, Bristol West, Foremost, Progressive, National General, Kraft Lake, Other.
- **BUSINESS_LOB_OPTIONS:** GL, BoP, Farm, Comm Auto, Workers Comp, E&O, Inland Marine, Umbrella, Cyber, Other.
- **BUSINESS_CARRIER_OPTIONS:** Farmers, Foremost, Progressive, Tapco, Hiscox, Next, Liberty Mutual,
  Berkshire Hathaway, Kraft Lake Compare, Other.
- **Residence:** Homeowner, Rent, Other. **Occupancy:** Own, Lease, Other.
- **Booster import column types:** Ignore, Name, Phone, Address, Mailing Address, Email, Date of Birth,
  Drivers License #, Notes, Business Name, Business Phone, Business Address, Business Email, Website,
  EIN, Line of Business. Rows with no Name and no Business Name dropped; Business Name → primarySide 'Business'.

---

## 9. Known Bugs / Gaps in Prototype (fix deliberately in rewrite)

1. **No level-up logic** — exp accrues, `level` never increments. → implement (§4.1).
2. **modifyQuest modal** referenced but not implemented. → design fresh.
3. **Binder search** bound but never applied to filter. → make functional.
4. **Quests-view search** has no state binding. → make functional.
5. **Hub "Start Card Quest"** and **Quests "Explore for Quests"** buttons dead (no onClick). → wire up.
6. **ClientCard active-quest "Cancel"** has no handler. → wire up.
7. **"Per Hit Rate"** hardcoded "$0 / $0". → compute or remove.
8. **Bonus Board** display-only (nothing increments progress / grants reward). → implement (§4.7).
9. **No coins/currency** despite Coins iconography. → decide (§10).
10. **"Exp Earned" vs "Commission Earned" sorts identical** (both sum log exp). → separate.
11. **No persistence / no auth.** → D1 + sessions.
12. **Booster import** silently ignores some mapped columns. → handle all mapped fields.
13. **Start Quest modal** used `document.getElementById` + `JSON.parse` + `alert()`. → idiomatic Svelte.
14. **`cardQuestTypes.filter(q => q.category !== 'Standalone')`** references nonexistent `category`. → clean up.
15. **Connections** (referredBy/referrals) modeled but never edited/displayed. → decide scope.

---

## 10. Decisions (resolved)

1. **Coins/currency:** ✅ Exp-only for v1. No coins.
2. **Auth:** ✅ Deferred — no login in v1; schema is auth-ready (§6).
3. **Persistence:** ✅ Cloudflare D1, single default user.
4. **Scope:** ✅ Full app — reproduce everything the current version had (all 4 screens, cards,
   quests, rules editor, booster import, scroll log, bonus board), fixing the §9 bugs.
5. **Level-up rewards:** universal rewards stay cosmetic/display for now (can gain effects later).

---

## 11. Target Architecture (rewrite)

```
SvelteKit + adapter-cloudflare   (frontend + backend in one, runs on Workers)
Cloudflare D1                    (SQL persistence, per-user)
Tailwind                         (carry over the look)
Vitest                           (unit tests, esp. functional core)

src/lib/core/    ← pure functions: leveling, calculateFinalExp, quest transitions,
                   relationship score, urgency, sorting. NO I/O. Heavily unit-tested.
src/lib/server/  ← D1 access, auth/sessions. The imperative shell.
src/routes/      ← SvelteKit pages + server endpoints (hub, quests, binder, rules, account, auth)
tests/           ← Vitest, mostly exercising src/lib/core
```

**Principle (functional core / imperative shell):** all game rules in §4 are pure functions of
their inputs, fully unit-tested; Cloudflare/D1/session concerns live only in the thin shell.
