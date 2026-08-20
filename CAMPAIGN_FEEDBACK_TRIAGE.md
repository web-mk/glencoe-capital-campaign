# Client feedback triage — Aug 20, 2026

Rabbi Sholom Wolberg reviewed the campaign site and sent 18 numbered edits,
stating he developed them "after a few chats with ChatGPT." This file records
the full request, our triage, what was implemented, and what is still open.

Guiding constraint from Mendel: do not let the site become designed by AI
committee. Protect the editorial design and the specificity of the copy.

---

## Client's stated big idea

> We are building the permanent home for the next chapter of Jewish life in Glencoe.

Still a capital campaign to purchase and transform 589 Vernon — explicitly NOT a
generic "fund Chabad" appeal. The building is the vehicle for something larger:
Jewish identity, connection, education, community and belonging.

His one-paragraph summary of what a visitor should grasp immediately:

> For seven years, Chabad of Glencoe has built a vibrant and growing Jewish
> community. At a defining moment for Jewish identity and belonging, we are
> creating a permanent home in the heart of Glencoe where Jewish life can deepen,
> expand and flourish for generations. The $2.3 million capital campaign will
> purchase and transform 589 Vernon into that home. Chabad of Glencoe is 100%
> locally funded, and this center will be built by the families who choose to
> become its founding generation.

Desired feeling: "This is our moment to build something lasting for Jewish Glencoe."

---

## The pattern worth naming

He gave **zero design feedback** — he called the design "phenomenal." All 18 items
are copy/structure. So the risk is not design-by-committee; it is copy flattening
and section proliferation.

Three concrete tells in his proposed copy:

1. **Verb quartet on repeat.** "Learn, celebrate, connect, grow" appears in his
   hero, his impact intro, and two of three impact cards. Across his copy,
   grow/growing appears 8x and connect/connection 5x.
2. **Direct collisions.** His Why Now says "children grow up knowing who they are";
   his Card 1 says "grow up with Judaism as a joyful and natural part of who they
   are"; the card's existing title is "Children who know who they are." Same
   phrase three times within two scroll-lengths.
3. **Section inflation.** He adds Why Now, Renderings, Momentum, Video, expanded
   Founding Generation, a donor section AND a sticky sidebar to a nine-section
   page. Roughly doubles scroll depth and pushes #donate far down.

---

## IMPLEMENTED (Aug 20, 2026)

Files touched: `index.html`, `src/styles.css`. Verified in a real browser:
correct section order, no dead CSS, no horizontal overflow at 390px, four tiers
matching top and bottom. Only console error is a pre-existing missing favicon.

| # | Change |
|---|--------|
| 6 | "For the first time, Jewish Glencoe will have a permanent address" → "For the first time, Chabad of Glencoe will have a permanent home of its own, in the heart of the community we serve." **He is factually right** — two established Reform temples exist in Glencoe. |
| 6 | "Hebrew School wing with two classrooms" → "Hebrew School wing" |
| 5 | Impact section moved ABOVE the 589 Vernon section (emotional payoff before spec list) |
| 5 | Eyebrow "Campaign Impact" → "The Future We're Building" |
| 5 | Removed "Square footage is not the point." (read as apologizing for the building) |
| 5 | New intro + his three rewritten cards, lightly de-duplicated (see Open Q5) |
| 11 | Dedication columns renamed: Lead Gifts / Visionary Gifts / Founders / Builders |
| 11 | 10-tier recognition wall (Patron→Friend) collapsed into those same four tiers: $250k+ / $100k+ / $18k+ / $1,800+ |
| 13 | Building Dedication moved from bottom of Lead column to FIRST, with premier card treatment (`.dedication-premier`) |
| 13 | Entrance Mezuzah removed; $36,000 tier is now "Bimah" alone |
| 2 | "100% locally funded" moved from footer-only to under the progress stats, gold rule, styled as a statement not a disclaimer |
| 16 | Campaign budget breakdown kept unchanged, as agreed |

### Why #11 mattered
The site genuinely had TWO competing systems: four dedication groups AND a
separate ten-level recognition wall. That was real confusion, not a preference.
Collapsing to four is a genuine simplification.

---

## OPEN QUESTIONS — need the client's answer

1. **"Reserved" on Building Dedication.** Now the most prominent item in the
   giving section. If it means "already committed," we are announcing the best
   opportunity is gone right where donors start looking — and by his own logic he
   would remove it (that is exactly why he pulled the entrance mezuzah). If it
   means "amount by conversation," it needs different words. ASK HIM WHICH.
2. **Accessible entry.** He said remove it, "not relevant." NOT removed —
   currently reads "Accessible entry, ramp, outdoor porch and patio." Quietly
   deleting accessibility from a community building is not a silent call. If the
   renovation genuinely has no ramp, remove it; if it does, keep it.
3. **Cognito needs a matching edit.** `Dedication` choice
   `Bimah, Entrance Mezuzah - $36,000` must become `Bimah - $36,000` or that
   button stops preselecting. Flagged in DEV_HANDOFF.md.
4. **Lost entry points.** Collapsing the wall removed one-click $3,600, $5,400,
   $10,000, $36,000, $54,000, $72,000. Dedication columns still cover most, but
   **$3,600 is gone entirely** — was the lowest rung above $1,800. Confirm OK.
5. **Card copy was lightly edited.** His Card 1 ended "a joyful and natural part
   of who they are" while its own title is "Children who know who they are."
   Trimmed that plus "build friendships"/"celebrate" repeats. Substance and
   program names (Jewish Women's Circle, Mentch Club) are all his. Show him.

---

## AGREED BUT NOT YET IMPLEMENTED

### Push back (design/fundraising risk)

- **#12 Sticky donor sidebar — the one that would actually damage the design.**
  (a) It fights a layout built on full-bleed photography — hero, vision banner,
  quote band. (b) With ~5 confirmed names it reads as empty, signalling a stalled
  campaign. (c) Publishing names by tier early can suppress mid-level gifts.
  Counter-offer: a proper donor section after Founding Generation, plus optionally
  a slim sticky *progress* bar which does the psychological work without touching
  the layout. On mobile he already agrees it becomes a normal section.

- **#18 Photography — partly not actionable.** THE SITE HAS ONLY FIVE CONTENT
  PHOTOS. He is right that Hebrew School (`cap-image-034`) and the community table
  shot (`gen-image-019`) are each used twice. But there is no Bar Mitzvah photo on
  the live page — he may be describing the design mockup, worth confirming. "A
  broad mix of children, teens, young adults, families, adults" is impossible with
  five images. CLIENT ACTION: send 25–30 photos. His underlying point is correct —
  the site skews young because 2 of 5 photos are children.

### Modify before implementing

- **#1 Hero — fight for this one.** His replacement drops the two most concrete
  things on the page: "private living room" and "589 Vernon Avenue." The headline
  he is KEEPING ("at last a home of its own") only lands if the reader knows it
  currently does not have one. His new paragraph removes the setup and keeps the
  punchline. Merge: his warmer opening clause, but the living room and the address
  stay.

- **#3 Our Story — "turning families away" is STILL LIVE on the page.** He is
  right to cut it (off-brand, and a claim you do not want in writing), but it is
  doing the load-bearing work of *why you need a building*. His replacement is
  entirely abstract. Keep one concrete capacity fact — growth as evidence, not
  scarcity as guilt.

- **#4 Why Now — good idea, too long.** Concept is strong and his instinct to keep
  it non-fear-based is right. But it is four stacked abstract paragraphs. Compress
  to a headline plus two sentences. The existing `.quote-band` treatment would
  carry it well.

- **#14 Presets — half right.** He is right the giving levels are explained twice.
  But those four presets live INSIDE the donation form at the moment of commitment,
  where one-click amounts do the most work. Replacing "$1,800" with "Founders —
  $54,000+" gives a category instead of a button. Counter: keep presets in the
  form; put his "Ways to Build" four-tier summary on the PAGE as the entry point.

- **#10 / page order — a conflict he found himself.** He wants "Be part of the
  founding generation" as a major theme AND "Founders" as tier 3 of 4. He noticed:
  "don't use the word founding because that's level 3." Recommendation: keep
  "founding generation" (strongest line in the campaign, already the donate
  headline) and rename the tier — e.g. Lead Gifts / Visionary Gifts / **Cornerstone**
  / Builders.

### Agree with him

- **#8 Momentum — he already disagreed with his own AI's suggestion.** Back him up:
  those milestones already exist in the progress stats bar (589 Vernon / June 2027
  / remaining). It would be a duplicate section.

### Blocked on assets

- **#7 Renderings** — new section, straightforward once images exist.
- **#9 Community video** — GOOD NEWS: already built and scaffolded in the code,
  hidden behind the `showVideo` flag in `site-config.js`. One switch when the file
  exists.
- **#16 note** — he wrote "Campaign Budget - not sure what this means." It is the
  financial breakdown already in the giving section. Just clarify; nothing to build.

---

## THE ACTUAL LAUNCH BLOCKER (his #15)

He framed a credit-card option as a preference. It is the gate. Cognito reports
`PaymentEnabled: false` while the page copy says "Pledge by credit card."

**There is no credit-card field in Cognito Forms.** Card fields appear
automatically once the form contains a field that actually collects payment.
Connecting Stripe alone does nothing. `TotalPledgeAmount` is currently a plain
Number field, which charges nothing.

Fix — a **Price field** whose amount is set via the conditional logic builder
(lightning-bolt icon): equal to `TotalPledgeAmount` only when
`Payment Method = Credit Card` AND `HowWouldYouLikeToGive = Give in full today`,
otherwise `$0`. A $0 total means no card section renders, so Check and Other
pledges submit cleanly without being forced into payment — which solves his #15
request in the same move. Requires adding a `Payment Method` choice field
(Credit Card / Check / Other) first.

Docs: https://www.cognitoforms.com/support/3/collecting-payment
      https://www.cognitoforms.com/support/38/building-forms/form-field-reference/price-field

MUST TEST: a $0 submission actually going through without demanding a card;
one small live card gift; one Check pledge; one installment pledge; confirmation
email; internal entry data.

### Cognito MCP
Now configured in Claude Code user scope and authorized. It failed initially with
"does not support dynamic client registration" — fixed by pinning the static
OAuth client_id from `~/.codex/config.toml`:

    claude mcp add --transport http --scope user \
      --client-id 366c9904-def2-451a-af2f-8e08d751088c \
      cognito-forms https://mcp.cognitoforms.com/mcp

Tools register as `mcp__cognito-forms__*` after a session restart. NOT YET KNOWN
whether the MCP can write form schema or only read. Form 202 is LIVE and
collecting pledges — show the client the exact change before making it.

---

## Suggested reply strategy

He led with genuine enthusiasm and did real work. Two catches are worth thanking
him for directly (the Reform temples line, the duplicate tier systems) — that buys
the credibility to push on the hero.

Structure: agree loudly on ~12 items, then spend capital on exactly three:
1. Hero specificity — do not lose the living room and the address
2. No sticky sidebar — offer the better alternative rather than refusing
3. Section count — frame it as protecting the design he already loves

Open with the payment blocker; it reframes the whole email around what actually
stands between him and launching. Close with a "what I need from you" list —
photos, confirmed donor names, renderings, video — so the four blocked items
visibly return to his court.
