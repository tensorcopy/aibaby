# Scandinavian Nursery Design Direction

## Goal

AI Baby should feel like a warm, premium baby product rather than a generic utility app. The target mood is calm, gentle, trustworthy, and young without becoming cartoonish.

This direction is the chosen outcome from the early UX exploration set.

Supporting exploration mockups are also stored in:

- `docs/mockup-soft-playroom.svg`
- `docs/mockup-scandinavian-nursery.svg`
- `docs/mockup-bright-storybook.svg`

## Core qualities

- Warm, soft, and baby-centered
- Premium rather than toy-like
- Calm enough for repeated daily use
- Clear enough for fast logging and review
- Visually distinct from productivity and health admin apps

## Visual principles

### 1. Soft neutral foundation

Use warm off-white and oat backgrounds instead of pure white. Surfaces should feel padded and quiet.

- App background: warm cream
- Card background: soft ivory
- Borders: low-contrast warm gray
- Avoid hard black and bright clinical whites

### 2. Muted nursery accents

Accent colors should come from a Scandinavian nursery palette rather than saturated consumer-app defaults.

| Token | Use | Hex |
| --- | --- | --- |
| `canvas` | app background | `#F4F0E8` |
| `surface` | cards / sheets | `#FBF8F3` |
| `surface-strong` | elevated panel | `#FFFFFF` |
| `line` | borders / dividers | `#E5DDD2` |
| `ink` | primary text | `#243038` |
| `ink-muted` | secondary text | `#708089` |
| `sage` | calm success / timeline accents | `#D6E7E0` |
| `sage-strong` | sage button text | `#365B52` |
| `dusty-blue` | primary action family | `#566B7A` |
| `dusty-blue-strong` | stronger action / links | `#455967` |
| `peach` | warmth / supportive highlights | `#F2D7C8` |
| `peach-strong` | warm emphasis text | `#8A6E5A` |
| `berry-soft` | gentle callouts / empty states | `#E9D7E1` |

### 3. Quiet editorial typography

Typography should feel softer and more premium than the current generic app shell.

- Headings: bold but not heavy
- Body text: open, calm, readable
- Labels: uppercase only for small metadata and section eyebrows
- Avoid overly geometric tech-product typography

Recommended usage:

- Hero title: `32-36px`, weight `700`
- Section title: `22-26px`, weight `700`
- Card title: `20-24px`, weight `700`
- Body: `15-17px`, weight `400-500`
- Meta label: `12-13px`, weight `700`, tracked slightly wider

## Layout rules

- Prefer generous vertical rhythm over dense dashboards
- Use large cards with clear internal padding
- Default corner radius should feel soft: `20-28px`
- Avoid stacking too many equally weighted panels on one screen
- Keep one primary action visually dominant per screen

Recommended spacing scale:

- `8`: tight icon / inline spacing
- `12`: between related copy blocks
- `16`: standard internal card spacing
- `24`: section spacing
- `32`: page rhythm and major separation

## Component direction

### Buttons

- Primary buttons should be broad, calm, and rounded
- Avoid neon CTAs or sharp rectangular controls
- Primary fill: `dusty-blue`
- Primary text: white
- Secondary buttons: low-contrast bordered pills or quiet text actions

### Cards

- Cards should look padded and tactile
- Use subtle borders before using shadow
- If shadow is used, keep it shallow and diffuse

### Inputs

- Inputs should feel like soft nursery stationery rather than enterprise forms
- Rounded fields, warm backgrounds, clear labels above fields
- Error states should be noticeable but gentle

### Empty / helper states

- Use kind, reassuring language
- Prefer soft accent blocks over alert-red warning boxes unless the action is truly blocked

## Screen-specific guidance

### Home

The home screen should feel like a daily welcome surface.

- Show the baby profile as a warm hero card
- Present only the most important next actions
- Timeline and summary links should read like calm destinations, not tool tiles

### Baby profile

The profile screen should feel more like a keepsake record than an admin form.

- Group the baby basics into soft sections
- Keep the save action anchored and clearly visible
- Use helper text to make the form feel guided and gentle

### Log meal

Meal logging should feel quick and emotionally light.

- Give text entry a soft journal-like surface
- Make photo add and quick actions feel friendly and tactile
- Show AI result and confirmation state in a warm, supportive card system

## Motion tone

- Slow and calm, never bouncy for the sake of motion
- Gentle fades and lifts are preferred
- Success transitions should feel reassuring, not celebratory in a game-like way

## Avoid

- Bright purple tech gradients
- Dense productivity-style dashboards
- Sharp corners and overly flat utility forms
- High-saturation toy colors across the whole screen
- Cold grayscale or “medical app” styling

## Deliverables in this phase

- Chosen direction document
- Home screen mockup
- Baby profile mockup
- Log meal mockup

The follow-up implementation task is `AIB-056`, which should apply this direction to the current mobile MVP screens first.
