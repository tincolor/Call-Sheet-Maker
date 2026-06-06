# Call Sheet Data Format

This document describes the JSON structure of a call sheet day as stored and consumed by Call Sheet Maker. Use it as a specification for generating synthetic example data.

---

## Top-level structure

A **day** object represents one shoot day. The app can hold multiple days; each is independent.

```json
{
  "id": "unique-string",
  "meta": { ... },
  "logos": [ ... ],
  "pageBreaks": [ ... ],
  "sections": [ ... ]
}
```

---

## `meta` — Header fields

All values are strings. Multi-line fields use `\n` for line breaks.

| Field | Description | Example |
|-------|-------------|---------|
| `company` | Production company name (multi-line OK) | `"Street Attack Japan K.K."` |
| `address` | Production company address (multi-line) | `"2-13, Akasaka 9-chome\nTokyo, Japan"` |
| `project` | Project / film title | `"The Training Ground"` |
| `client` | Client name(s) | `"Hyundai Motor Company × Boston Dynamics"` |
| `mainLocation` | Primary shoot location | `"Boston Dynamics HQ · Waltham, MA"` |
| `date` | Shoot date, formatted for display | `"2026.04.30 (THU)"` |
| `day` | Shoot day number | `"3"` |
| `shootCall` | General crew call time (HH:MM, 24h) | `"07:00"` |
| `emergency` | On-call emergency contact(s) (multi-line) | `"Jane Smith (Producer) 555-123-4567"` |
| `weatherCallout` | Weather summary | `"PARTLY CLOUDY · 64° / 45°F"` |
| `headerNote` | Optional note shown in header (multi-line) | `"COVID protocols in effect"` |
| `sunrise` | Sunrise time | `"5:47"` |
| `sunset` | Sunset time | `"7:40"` |
| `crew.director` | Director name (leading space OK) | `" Jane Smith"` |
| `crew.dop` | Director of Photography | `" Marcus Lee"` |
| `crew.lp` | Line Producer | `" Rachel Torres"` |
| `crew.usprod` | US Producer (or second producer credit) | `" Tom Chen"` |

**Notes:**
- `company`, `address`, `project`, `client`, `mainLocation`, `emergency`, `weatherCallout`, `headerNote` may contain `\n` newlines.
- All other fields are single-line strings.
- Any field may be an empty string `""` if not applicable.

---

## `logos`

An array of 0–2 logo objects. Each has a label and a base64-encoded image data URL. When generating examples, omit this field or use an empty array — the app provides default logos.

```json
"logos": []
```

---

## `pageBreaks`

An array of page break position markers. The app auto-computes most page breaks; this array stores only **manual** breaks added by the user.

```json
"pageBreaks": [
  { "before": "<sectionId>" },
  { "beforeRow": { "sectionId": "<sectionId>", "idx": 3 } }
]
```

| Entry | Meaning |
|-------|---------|
| `{ "before": sectionId }` | Force a new page before this section |
| `{ "beforeRow": { sectionId, idx } }` | Force a new page before row index `idx` in the schedule section |

For generated examples, use `"pageBreaks": []` (empty). The app will auto-paginate.

---

## `sections`

An ordered array of section objects. Each section has:

```json
{
  "id": "unique-string",
  "type": "schedule | contacts | equipment | hospital | basecamp | notes",
  "title": "Display title",
  "data": ...
}
```

`type` determines the shape of `data`. Sections can appear in any order. Multiple sections of the same type are allowed (e.g., multiple `contacts` sections for different departments).

---

### Section type: `schedule`

The shoot schedule. There is typically one per call sheet but may be absent.

```json
{
  "id": "s1",
  "type": "schedule",
  "title": "Schedule",
  "data": [ ...rows... ]
}
```

`data` is an ordered array of **row** objects. Two row types exist:

#### Regular row (`type: "row"`)

```json
{
  "type": "row",
  "time": "07:00",
  "dur": "1h",
  "task": "LOAD IN",
  "loc": "Studio A — Stage 4",
  "cast": "Full crew",
  "note": "Doors open at 06:30"
}
```

| Field | Description |
|-------|-------------|
| `time` | Start time in `HH:MM` 24-hour format. The app auto-calculates downstream times based on `dur`, so only the first row's time needs to be manually set. |
| `dur` | Duration. Format: `"1h"`, `"30m"`, `"1h30m"`, `"2h"`. May be empty `""`. |
| `task` | Scene or activity description. May include scene numbers, sluglines. |
| `loc` | Location or room name. May be multi-line. |
| `cast` | Cast members, extras, or crew required. Semicolon-separated is conventional. |
| `note` | Additional notes, reminders, or caveats. |

#### Spanning row (`type: "span"`)

Used for all-column events like lunch, travel, or wrap. Renders as a single merged cell.

```json
{
  "type": "span",
  "time": "13:00",
  "dur": "1h",
  "text": "LUNCH BREAK — Cafeteria (TBC)"
}
```

| Field | Description |
|-------|-------------|
| `time` | Start time (same format as row) |
| `dur` | Duration (same format as row, or `""`) |
| `text` | Bold text displayed across all columns |

**Conventions:**
- The first row of the day is often `LOAD IN` or `CREW CALL`.
- The last entry is often a `span` row with `text: "WRAP"` and empty `dur`.
- Lunch and meal breaks are typically `span` rows.
- Scene references often include sluglines: `"SC 12A — INT. OFFICE — DAY"`.

---

### Section type: `contacts`

A department or group's contact list. Multiple contact sections are typical on a single sheet.

```json
{
  "id": "s2",
  "type": "contacts",
  "title": "Crew Contacts",
  "data": [
    { "role": "Director", "name": "Jane Smith", "phone": "555-100-2000" },
    { "role": "DOP", "name": "Marcus Lee", "phone": "marcus@studio.com" },
    { "role": "1st AC", "name": "Priya Nair", "phone": "555-300-4000" }
  ]
}
```

`data` is an array of contact objects:

| Field | Description |
|-------|-------------|
| `role` | Job title or department. Plain text, no format constraints. |
| `name` | Full name |
| `phone` | Phone number, email, or any contact string. May be empty `""`. |

**Conventions:**
- Typical section titles: `"Crew Contacts"`, `"Client Contacts"`, `"Agency"`, `"Production"`, `"Talent"`, `"Lab"`, `"Vendors"`, department names.
- `phone` often contains email addresses for agency/client contacts.
- `role` can be verbose: `"Producer (NY Office)"`, `"1st AC (Boston)"`.

---

### Section type: `equipment`

A checklist of equipment items. Items can be marked done (checked off).

```json
{
  "id": "s3",
  "type": "equipment",
  "title": "Equipment Checklist",
  "data": [
    { "text": "Sony FX6 + batteries", "done": false },
    { "text": "Tripod (Miller)", "done": false },
    { "text": "RENTAL · Angenieux EZ-1 zoom", "done": false }
  ]
}
```

`data` is an array of item objects:

| Field | Description |
|-------|-------------|
| `text` | Item description. Free text. |
| `done` | Boolean. Always `false` for generated examples (nothing pre-checked). |

**Conventions:**
- Owned gear vs rentals are often distinguished with a prefix: `"RENTAL · "` or `"(rental)"`.
- Items are grouped loosely: cameras, lenses, support/rigs, lighting, sound, storage.
- Accessories (batteries, cards, cables, mounts) appear as separate line items.

---

### Section type: `hospital`

Nearest emergency medical facility. There is typically one per call sheet.

```json
{
  "id": "s4",
  "type": "hospital",
  "title": "Nearest Hospital",
  "data": {
    "name": "Newton-Wellesley Hospital (nearest ER)",
    "addr": "2014 Washington St, Newton, MA 02462",
    "phone": "617-243-6000",
    "hours": "24h / ER",
    "dist": "~6 mi / 15 min from base camp"
  }
}
```

`data` is a single object (not an array):

| Field | Description |
|-------|-------------|
| `name` | Hospital name, with clarification in parens if helpful |
| `addr` | Full street address |
| `phone` | Main switchboard or ER direct line |
| `hours` | Hours of operation, e.g. `"24h / ER"`, `"Open 08:00–20:00"` |
| `dist` | Distance / travel time from base camp, e.g. `"~4 mi / 10 min"` |

Any field may be `""` if unknown.

---

### Section type: `basecamp`

Parking, base camp location, and on-set facilities. There is typically one per call sheet.

```json
{
  "id": "s5",
  "type": "basecamp",
  "title": "Parking / Basecamp",
  "data": {
    "name": "Residence Inn Waltham (hotel basecamp)",
    "addr": "Waltham, MA",
    "parking": "On-site at BD HQ — confirm w/ location contact",
    "restroom": "Inside main building, 2nd floor",
    "catering": "Cafeteria (TBC) — $18 lunch buyout"
  }
}
```

`data` is a single object (not an array):

| Field | Description |
|-------|-------------|
| `name` | Base camp / hotel / staging area name |
| `addr` | Address or cross streets |
| `parking` | Parking instructions |
| `restroom` | Restroom / facilities location |
| `catering` | Catering / meal arrangement |

Any field may be `""`.

---

### Section type: `notes`

Free-form text notes. There is typically one per call sheet, usually at the end.

```json
{
  "id": "s6",
  "type": "notes",
  "title": "Notes",
  "data": {
    "text": "All crew to sign NDA before entering facility.\nNo personal photography on premises.\nSilent set for all takes."
  }
}
```

`data` is a single object:

| Field | Description |
|-------|-------------|
| `text` | Multi-line plain text. Use `\n` for line breaks. May be `""`. |

---

## Complete minimal example

A simple one-day call sheet JSON:

```json
{
  "id": "day-001",
  "meta": {
    "company": "Aperture Films",
    "address": "44 Canal St, Suite 3\nNew York, NY 10013",
    "project": "Sonder — Brand Film",
    "client": "Sonder Hotels",
    "mainLocation": "Sonder Williamsburg · 234 N 9th St, Brooklyn",
    "date": "2026.05.15 (FRI)",
    "day": "1",
    "shootCall": "06:30",
    "emergency": "Dana Reyes (Producer) 646-555-0190",
    "weatherCallout": "OVERCAST · 58° / 49°F",
    "headerNote": "",
    "sunrise": "5:52",
    "sunset": "8:04",
    "crew.director": " Chris Nakamura",
    "crew.dop": " Fatima Osei",
    "crew.lp": " Dana Reyes",
    "crew.usprod": ""
  },
  "logos": [],
  "pageBreaks": [],
  "sections": [
    {
      "id": "sched-1",
      "type": "schedule",
      "title": "Schedule",
      "data": [
        { "type": "row",  "time": "06:30", "dur": "1h",   "task": "LOAD IN & PREP",         "loc": "Room 201",           "cast": "",                    "note": "Coordinate with hotel staff" },
        { "type": "row",  "time": "07:30", "dur": "2h",   "task": "SC 1 — INT. ROOM — DAY", "loc": "Room 201",           "cast": "Talent A",            "note": "" },
        { "type": "row",  "time": "09:30", "dur": "1h30m","task": "SC 3 — INT. LOBBY — DAY","loc": "Ground floor lobby", "cast": "Talent A; Talent B",  "note": "No guests in frame" },
        { "type": "span", "time": "11:00", "dur": "45m",  "text": "LUNCH — Provided on location" },
        { "type": "row",  "time": "11:45", "dur": "3h",   "task": "SC 7 — EXT. ROOFTOP",    "loc": "Rooftop terrace",    "cast": "Full talent",         "note": "Weather-dependent. Alt: SC 9 interior" },
        { "type": "span", "time": "14:45", "dur": "",     "text": "WRAP" }
      ]
    },
    {
      "id": "contacts-crew",
      "type": "contacts",
      "title": "Crew Contacts",
      "data": [
        { "role": "Director",        "name": "Chris Nakamura", "phone": "646-555-0101" },
        { "role": "DOP",             "name": "Fatima Osei",    "phone": "646-555-0102" },
        { "role": "Producer",        "name": "Dana Reyes",     "phone": "646-555-0190" },
        { "role": "1st AC",          "name": "Luca Ferrara",   "phone": "646-555-0103" },
        { "role": "Sound Op",        "name": "Mia Johansson",  "phone": "646-555-0104" },
        { "role": "PA",              "name": "Andre Diallo",   "phone": "646-555-0105" }
      ]
    },
    {
      "id": "contacts-client",
      "type": "contacts",
      "title": "Client — Sonder Hotels",
      "data": [
        { "role": "Brand Manager",   "name": "Priya Shah",     "phone": "priya.shah@sonder.com" },
        { "role": "Location Liaison","name": "Tom Becker",     "phone": "212-555-0200" }
      ]
    },
    {
      "id": "hospital-1",
      "type": "hospital",
      "title": "Nearest Hospital",
      "data": {
        "name": "Woodhull Medical Center",
        "addr": "760 Broadway, Brooklyn, NY 11206",
        "phone": "718-963-8000",
        "hours": "24h / ER",
        "dist": "~1.2 mi / 5 min from location"
      }
    },
    {
      "id": "basecamp-1",
      "type": "basecamp",
      "title": "Parking / Basecamp",
      "data": {
        "name": "Sonder Williamsburg",
        "addr": "234 N 9th St, Brooklyn, NY 11211",
        "parking": "Metered street parking on N 9th St; nearest lot: N 7th & Bedford",
        "restroom": "Hotel lobby — ground floor",
        "catering": "Catered lunch 11:00 — $0 buyout included"
      }
    },
    {
      "id": "equipment-1",
      "type": "equipment",
      "title": "Equipment Checklist",
      "data": [
        { "text": "Sony FX3 + batteries (×3)", "done": false },
        { "text": "Sony 24–70mm f/2.8 GM", "done": false },
        { "text": "Sony 85mm f/1.4 GM", "done": false },
        { "text": "DJI RS 3 Pro gimbal", "done": false },
        { "text": "Tripod (Sachtler Ace L)", "done": false },
        { "text": "SmallHD Focus 7 monitor", "done": false },
        { "text": "CFexpress cards ×4 + reader", "done": false },
        { "text": "RENTAL · Aputure 300x LED + softbox", "done": false },
        { "text": "RENTAL · 4ft × 4ft diffusion frame", "done": false },
        { "text": "Rode NTG3 boom + Zoom F6 recorder", "done": false },
        { "text": "Lavalier kit (×2 Sennheiser G4)", "done": false }
      ]
    },
    {
      "id": "notes-1",
      "type": "notes",
      "title": "Notes",
      "data": {
        "text": "Hotel has approved our equipment list — no additional permits required.\nAll crew must check in at front desk before accessing guest floors.\nQuiet hours end at 08:00; plan accordingly for rooftop setup."
      }
    }
  ]
}
```

---

## Generation guidelines

When creating example call sheets with an AI model, vary the following to produce realistic diversity:

- **Industry / genre**: commercial, narrative film, documentary, music video, corporate video, news segment, fashion editorial, live event
- **Location type**: studio, practical interior, exterior urban, exterior rural, multi-location day
- **Crew size**: skeleton crew (3–5 people), mid-size (8–15), large (20+)
- **Schedule density**: half-day with 3 scenes, full day with 7+ scenes, night shoot
- **Section count**: minimal (schedule + crew + notes) vs. full (all 6 section types, multiple contact groups)
- **Equipment complexity**: run-and-gun minimal kit vs. large camera + lighting package with extensive rentals
- **Notes content**: safety reminders, NDA notices, parking specifics, on-set rules, meal arrangements, weather contingencies

**What to keep realistic:**
- Times always progress forward through the day in the schedule
- `dur` values add up plausibly (a 10-hour day, not 30)
- Cast listed in regular rows corresponds to people listed in contacts sections
- Hospital distance is realistic for the stated shoot location
- Equipment items are real gear (camera bodies, lenses, lights, audio) with real model names
