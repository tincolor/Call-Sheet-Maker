---
name: call-sheet
description: >
  Convert raw production notes into a correctly-formatted call-sheet CSV for Tom's call-sheet app.
  Use this skill whenever Tom supplies raw shoot-day notes (WhatsApp threads, emails, voice-memo
  transcripts, mixed EN/JP text) and wants a call-sheet CSV in return. Trigger phrases include:
  "make a call sheet", "fill in the call sheet", "create a call sheet CSV", "prep the call sheet",
  or any time Tom drops in production notes and references a shoot day or schedule.
  Always use this skill — do not attempt to produce call-sheet CSVs ad hoc without reading it first.
---

# Call Sheet Skill

Tom is a film director and producer based in Tokyo. He runs shoots for Japanese domestic clients and international broadcasters. His call sheets are operational documents — functional, precise, and used on-set by crew. The output of this skill is a CSV file that is imported directly into his call-sheet app.

---

## What This Skill Does

Takes raw production notes in any format (WhatsApp, email, voice memo, mixed EN/JP) and converts them into a correctly structured CSV file that Tom's call-sheet app can import via its **Import CSV** function.

---

## CSV Format Rules

These rules are absolute. Never deviate from them.

### Top-Level Structure

- The file consists of one or more **day blocks**, each beginning with a `# DAY · <label>` header line.
- Each day block contains a `# META` section followed by one or more typed sections.
- Sections are separated by a blank line.
- Output ONLY the CSV — no prose, no code fences, no explanation.

### Day Block Header

```
# DAY · 2026.04.28 (TUE)
```

Format: `# DAY · YYYY.MM.DD (DAY-ABBREV)`

### META Section

```
# META
key,value
company,Street Attack Japan K.K.
address,"2-13 Akasaka 9-chome, Minato-ku, Tokyo 107-0052"
project,PROJECT NAME
client,CLIENT NAME
mainLocation,City / Country
date,2026.04.28 (TUE)
day,1
shootCall,07:00
emergency,Producer Name — +1 555 555 5555
weatherCallout,PARTLY CLOUDY · 64° / 45°F
sunrise,5:47
sunset,7:40
```

- Always include all META keys, even if value is blank.
- Company defaults to **Street Attack Japan K.K.** and address to **2-13 Akasaka 9-chome, Minato-ku, Tokyo 107-0052** unless Tom specifies otherwise.
- `day` is the shoot day number (integer).

### Section Types

#### SCHEDULE

```
# SCHEDULE · Schedule
type,time,dur,task,loc,cast,note
row,07:00,1h,LOAD IN,Location address,,Crew call
row,08:00,4h,SCENE 1,Studio A,Cast names,Any notes
span,12:00,1h,LUNCH,,,
span,17:00,,WRAP,,,
```

- `type=row` for normal schedule rows.
- `type=span` for full-width dividers: LUNCH, WRAP, TRAVEL, BREAK. Put label in `task`; leave `loc`, `cast`, `note` empty.
- `dur` format: `1h`, `30m`, `1h30m`. Leave blank if unknown.
- Times in 24h format.

#### CONTACTS (repeatable)

```
# CONTACTS · Crew Contacts
role,name,phone
Producer,Jane Doe,+1 555 555 5555
Director,John Smith,john@example.com
```

- Title after `·` is free text — use it to group contacts logically (e.g. `Crew Contacts`, `Client`, `Talent`, `Vendors`).
- Repeat the block for each group. Multiple CONTACTS blocks are fully supported.
- `phone` column accepts phone numbers, email addresses, or both.

#### EQUIPMENT

```
# EQUIPMENT · Equipment Checklist
text,done
FX6 + rigging + batteries,false
FX3 + batteries,false
```

- `done` is always `false` unless Tom explicitly says an item is already confirmed/packed.

#### HOSPITAL

```
# HOSPITAL · Nearest Hospital
key,value
name,Hospital name
addr,Full street address
phone,+1 555 555 5555
hours,24h / ER
dist,~6 mi / 15 min
```

#### BASECAMP

```
# BASECAMP · Parking / Basecamp
key,value
name,Basecamp name
addr,Address
parking,On-site parking note
restroom,Restroom location
catering,Catering note
```

#### NOTES

```
# NOTES · Notes
key,value
text,"Free-text notes. Multi-line OK if quoted."
```

---

## CSV Quoting Rules

- Quote any value that contains commas, newlines, or quotation marks: `"like, this"`
- Escape embedded quotes by doubling them: `"He said ""action"""`
- Do not quote values that don't need it.

---

## Section Inclusion Rules

- **Only include sections that have real content.** Skip empty sections entirely.
- SCHEDULE and CONTACTS (at minimum one) should almost always be present.
- HOSPITAL and BASECAMP: include only if Tom provides location data.
- NOTES: include only if there are miscellaneous notes that don't fit elsewhere.

---

## Multi-Day Shoots

- If the notes cover multiple shoot days, produce one `# DAY · ...` block per day.
- Repeat CONTACTS blocks across days only if there are changes — otherwise Tom can re-use.
- Shared crew across days: repeat the CONTACTS block in each day block (the app treats each day independently).

---

## Handling Raw Notes

Tom's notes may arrive as:
- WhatsApp threads (timestamps, names, mixed languages)
- Email chains (quoted replies, forwarded messages)
- Voice-memo transcripts (informal, fragmented)
- Mixed English/Japanese text

**Extraction priorities:**
1. Pull all times into SCHEDULE rows, inferring task names from context.
2. Extract all named people and their roles into CONTACTS.
3. Pull equipment mentions into EQUIPMENT.
4. Pull any location-specific info (parking, hospital, basecamp) into the relevant sections.
5. Any stray information that doesn't fit a typed section goes into NOTES.

If a field cannot be inferred, leave it blank rather than inventing a value.

---

## Default Values (Tom's Productions)

Unless the notes override these, use the following defaults:

| Field | Default |
|---|---|
| `company` | Street Attack Japan K.K. |
| `address` | 2-13 Akasaka 9-chome, Minato-ku, Tokyo 107-0052 |
| Equipment `done` | false |

---

## Workflow

When Tom triggers this skill:

1. **Read all notes** before producing any output.
2. **Identify how many shoot days** are present. If ambiguous, treat as one day and note the assumption.
3. **Produce the CSV** in strict compliance with the format above.
4. **Output ONLY the raw CSV** — no explanation, no code fences, no preamble.
5. After outputting the CSV, add one brief line: *"Save as `shoot-YYYY-MM-DD.csv` and import via Import CSV in the appbar."* — but only after the CSV, not before.

---

## Complete Template (Reference)

This is the canonical template. The CSV output must be structurally compatible with it.

```
# DAY · 2026.04.28 (TUE)
# META
key,value
company,Street Attack Japan K.K.
address,"2-13 Akasaka 9-chome, Minato-ku, Tokyo 107-0052"
project,PROJECT NAME
client,CLIENT NAME
mainLocation,City / Country
date,2026.04.28 (TUE)
day,1
shootCall,07:00
emergency,Producer Name — +1 555 555 5555
weatherCallout,PARTLY CLOUDY · 64° / 45°F
sunrise,5:47
sunset,7:40

# SCHEDULE · Schedule
type,time,dur,task,loc,cast,note
row,07:00,1h,LOAD IN,Location address,,Crew call
row,08:00,4h,SCENE 1,Studio A,Cast names,Any notes
span,12:00,1h,LUNCH,,,
span,17:00,,WRAP,,,

# CONTACTS · Crew Contacts
role,name,phone
Producer,Jane Doe,+1 555 555 5555
Director,John Smith,john@example.com

# CONTACTS · Client
role,name,phone
Client Lead,Client Name,

# EQUIPMENT · Equipment Checklist
text,done
FX6 + rigging + batteries,false
FX3 + batteries,false

# HOSPITAL · Nearest Hospital
key,value
name,Hospital name
addr,Full street address
phone,+1 555 555 5555
hours,24h / ER
dist,~6 mi / 15 min

# BASECAMP · Parking / Basecamp
key,value
name,Basecamp name
addr,Address
parking,On-site parking note
restroom,Restroom location
catering,Catering note

# NOTES · Notes
key,value
text,"Free-text notes. Multi-line OK if quoted."
```
