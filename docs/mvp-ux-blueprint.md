# MVP UX Blueprint

## Purpose

This document defines the end-to-end user experience for the AI Baby MVP before further feature development.

It should be used as the product and design source of truth for:

- screen hierarchy
- navigation model
- experience goals per surface
- interaction patterns
- empty, loading, error, and success states
- design expectations for future implementation tasks

This blueprint assumes the chosen **Scandinavian Nursery** visual direction and the new **chat-first mobile entry** decision.

---

## Product UX Thesis

AI Baby should feel like:

- talking to a calm AI parenting assistant
- capturing baby meals with very low effort
- reviewing patterns in pages only when needed
- receiving supportive feedback instead of administrative friction

The app should **open into conversation first** and **use pages as secondary review spaces**.

---

## Experience Principles

### 1. Conversation is the home screen

The first thing a caregiver sees should be the active AI chat thread, not a dashboard.

### 2. One send action per thought

Users should be able to attach photos, type a short note, and send both together in one action.

### 3. AI should reduce effort, not create work

The assistant should ask follow-up questions only when necessary and should keep them short and easy to answer.

### 4. Review belongs in calm pages

Timeline, summaries, reminders, and long-term review should exist as secondary destinations for reflection, not as the primary entry point.

### 5. Every state should feel supportive

Loading, empty, and failure states should reassure the caregiver and show the next safe action.

---

## Primary User Journeys

### Journey A: First-time parent

1. Open app
2. See AI assistant welcome thread
3. Create baby profile through guided conversation or profile shortcut
4. Return to chat automatically
5. Send first meal with photo and short description
6. Review AI draft
7. Confirm or correct
8. Continue chatting or open timeline later

### Journey B: Returning daily logging user

1. Open app
2. Land in the active AI conversation
3. Send a mixed message with photos plus text
4. Receive structured draft and optional clarification
5. Confirm record
6. Stay in conversation for the next meal

### Journey C: Weekly review user

1. Open app into chat
2. Tap summary or review destination from chat header, pinned shortcuts, or assistant prompt
3. Read daily / weekly / 7-day / 30-day review pages
4. Return to chat easily

---

## Navigation Model

## Default mobile information architecture

### Primary route

- `Chat`
  - default app landing
  - AI assistant thread
  - mixed composer
  - AI draft confirmation moments

### Secondary routes

- `Baby Profile`
- `Today Timeline`
- `Summary History`
- `Daily Summary Detail`
- `Weekly Summary Detail`
- `Reminders`
- `7-Day Review`
- `30-Day Review`
- `Export`

### Navigation pattern

- bottom navigation is optional for MVP; not required if it adds visual weight
- preferred MVP pattern:
  - chat as the root screen
  - lightweight top-right / top-sheet navigation for review destinations
  - in-thread shortcut chips for Today, Summaries, and Profile

---

## Screen Inventory

## 1. Chat Home

### Goal

Make the product feel immediately alive and assistant-driven.

### Key UI regions

- top bar with baby identity and context
- scrollable AI conversation
- persistent composer dock
- attachment tray for images
- quick suggestion chips

### Content model

- assistant greeting
- prior confirmed meal cards
- pending AI draft cards
- clarification prompts
- review prompts such as “See today’s timeline”

### Main actions

- send text only
- send photos only
- send photos plus text together
- answer follow-up
- confirm AI draft
- edit AI draft
- open review destination

### Empty state

- warm welcome from AI assistant
- one short explanation of how to log a meal
- one clear CTA to create baby profile if missing

### Success state

- confirmed meal appears as a calm “saved” card in-thread
- assistant gives one brief supportive response

### Error state

- failed send appears inline in-thread
- user can retry from the failed message
- no modal dead-end

## 2. Baby Profile

### Goal

Capture the minimum baby context needed for personalized logging, reminders, and summaries.

### UX posture

- guided record, not admin form
- the profile can be opened from chat, but after save the user should be able to return directly to conversation

### Main sections

- baby basics
- feeding context
- dietary restrictions / allergens
- supplements
- caregiver context

### Required behavior

- save must always result in visible success, visible failure, or visible retry path
- on failure, the user must still be able to go back safely

## 3. Today Timeline

### Goal

Let caregivers review the day without interrupting the chat-first core flow.

### Content blocks

- date header
- meal records in chronological order
- AI draft / confirmed distinction
- photo thumbnails
- milk / supplement entries
- daily summary teaser if available

### Main actions

- edit a meal record
- open full summary
- return to chat

## 4. Summary History

### Goal

Provide a quiet archive of daily and weekly outputs.

### Content blocks

- daily summary cards
- weekly summary cards
- newest first
- clear labels for incomplete / skipped / generated states

### Main actions

- open daily summary detail
- open weekly summary detail
- jump back to chat

## 5. Daily Summary Detail

### Goal

Turn the day’s intake into gentle, actionable feedback.

### Sections

- day overview
- nutritional coverage
- likely gaps
- tomorrow suggestions
- supporting records link

### Tone

- concise
- calm
- supportive rather than judgmental

## 6. Weekly Summary Detail

### Goal

Help parents understand trends rather than individual meals.

### Sections

- week snapshot
- food variety trends
- protein / iron / vegetables / fruit patterns
- notable wins
- next-week suggestions

## 7. Reminders

### Goal

Deliver age-stage guidance that feels timely and useful.

### Sections

- today’s active reminders
- recent reminder history
- why this matters at the current age
- actions or examples caregivers can try

## 8. 7-Day Review

### Goal

Offer a quick short-window reflection page.

### Sections

- overall intake rhythm
- repeated foods
- missing variety signals
- reminder carryover
- concise takeaways

## 9. 30-Day Review

### Goal

Provide a broader trend view without overwhelming the user.

### Sections

- recurring food patterns
- progression of variety
- reminders and stage transitions
- change over time

## 10. Export

### Goal

Make data portability feel trustworthy and user-owned.

### UX requirements

- explain what gets exported
- show media behavior clearly
- indicate when export is in progress vs ready

---

## Chat Experience Blueprint

## Conversation structure

Each thread can contain:

- AI welcome messages
- caregiver messages
- mixed media + text messages
- AI draft response cards
- clarification prompts
- confirmation cards
- review suggestion cards

## Composer behavior

The composer should support:

- text field
- image attachment strip
- one send button
- clear combined send behavior

If both images and text are present:

- one tap sends them together as one conversational turn
- the resulting thread item should display both together

## Quick prompts

Useful quick prompts:

- `Breakfast`
- `Lunch`
- `Dinner`
- `Snack`
- `Milk`
- `Show today's timeline`
- `What should I focus on this week?`

## AI response rules

- prefer one clear next step
- keep outputs short in-thread
- move long analysis to linked pages
- preserve emotional warmth

---

## State Design Rules

## Loading

- use skeleton or soft placeholder cards where possible
- never block the whole app with a hard spinner unless the app is bootstrapping

## Empty

- empty states should teach the next action
- empty review pages should point back to chat

## Error

- errors should appear inline whenever possible
- show a retry action near the failed object
- avoid trapping the user on a dead-end screen

## Success

- success should appear near the completed action
- use gentle language such as “Saved”, “Confirmed”, or “Ready”
- avoid celebratory gamification

---

## Component System Expectations

## Core components

- AI message bubble
- caregiver message bubble
- mixed media message card
- AI draft confirmation card
- meal item chip
- image attachment strip
- inline retry banner
- summary preview card
- reminder card
- calm primary button
- outlined secondary button
- soft section card

## Interaction rules

- use broad touch targets
- keep interactive density low
- maintain strong visual hierarchy between AI outputs and editable user content

---

## Accessibility Expectations

- all key actions must be reachable by screen reader
- form labels must be explicit
- status changes should be announced when practical
- color should not be the only success/error signal
- tap targets should stay comfortable for tired caregivers using one hand

---

## Implementation Order From This Blueprint

1. `AIB-029` chat-first landing route
2. `AIB-057` mixed text + image send action
3. `AIB-058` persistent AI chat thread
4. `AIB-028` profile save failure recovery
5. `AIB-035` summary history view
6. `AIB-043` and `AIB-044` review pages
7. reminders and export surfaces

---

## Definition Of Done For UX Before Development

This blueprint is sufficient when engineering can answer:

- what the default app entry screen is
- what every core MVP screen does
- how users move between conversation and review pages
- how mixed media + text send should behave
- how loading, empty, error, and success states should feel
- what visual and interaction tone the app should preserve

Future screen mockups can extend this document, but feature teams should not need to guess the intended experience shape anymore.
