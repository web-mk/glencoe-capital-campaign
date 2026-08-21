# Client feedback triage

**Feedback received:** Aug 20, 2026 · **Last updated:** Aug 21, 2026

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

## IMPLEMENTED (Aug 20–21, 2026)

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

### Added Aug 21, 2026

| Item | Change |
|---|---|
| — | Campaign totals now fetched live from a Google Sheet the office edits; budget breakdown reconciles to the goal automatically |
| 15 | Payment flow completed — see "HIS #15 — RESOLVED" below |
| 13 | Building Dedication briefly relabelled "By Conversation" after confirming the client never wrote "Reserved"; reverted once Mendel confirmed it genuinely is reserved |
| — | Embedded form fixed: submit button was unreachable, dedication cards were crushed to 212px, selected-state badge was clipped, headings and payment labels restyled |

### Why #11 mattered
The site genuinely had TWO competing systems: four dedication groups AND a
separate ten-level recognition wall. That was real confusion, not a preference.
Collapsing to four is a genuine simplification.

---

## OPEN QUESTIONS — need the client's answer

1. ~~**"Reserved" on Building Dedication.**~~ RESOLVED Aug 21, 2026. The label
   came from the original build, not from the client's email — he never wrote it.
   Confirmed with Mendel that the building naming genuinely IS reserved, so the
   label stays. It keeps the premier card treatment the client asked for in #13,
   which reads as campaign momentum rather than a missing opportunity. Note this
   differs from how the entrance mezuzah was handled (removed once committed);
   if the client would rather hide claimed dedications entirely, this one should
   go too.
2. **Accessible entry.** He said remove it, "not relevant." NOT removed —
   currently reads "Accessible entry, ramp, outdoor porch and patio." Quietly
   deleting accessibility from a community building is not a silent call. If the
   renovation genuinely has no ramp, remove it; if it does, keep it.
3. ~~**Cognito needs a matching edit** for the Bimah dedication.~~ RESOLVED
   Aug 21, 2026. Renamed in Cognito and verified preselecting from the page.
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

## HIS #15 — RESOLVED (Aug 21, 2026)

He framed a credit-card option as a preference. It was in fact the launch gate:
the page said "pledge by credit card" and the form could not take one. Stripe was
connected but nothing was switched on to use it.

**This is now working and verified end to end in a browser.**

- Credit card gifts charge through Stripe.
- Check, Donor-Advised Fund and appreciated-stock commitments submit as pledges
  with no card demanded — exactly what he asked for.
- Multi-year pledges submit as pledges, no card, no order.
- Processing fees are OFF: an $1,800 gift bills $1,800, not $1,854.07.
- The form no longer requires every donor to consent to storing their card.
- Dedication buttons on the page carry the dedication and amount into the form.
  Verified: Sanctuary totals $360,000, Mezuzah totals $5,400.

The form was restructured along the way — prices now live on the choice options
rather than in a separate amount field, and `TotalPledgeAmount`, `PresetAmount`
and `HowWouldYouLikeToGive` no longer exist. Full technical detail, including the
prefill rules that keep the site in sync, is in `DEV_HANDOFF.md` under "Cognito
Forms integration" and "Payment launch blocker".

### Still open in Cognito (not client-facing)

1. **Workflow status.** Every submission files as "Pledge Recorded", including a
   completed card payment, and the internal actions are deleted. The entry data
   cannot distinguish paid from promised.
2. `PriceItemName` is an empty formula, so the order line item and receipt render
   with no name.
3. "Show Prices in Choice Field" should be off for `OtherAmounts`, whose labels
   already state the amount.
4. The Cognito section and the generated order block are both headed "Payment",
   so two identical headings stack.

### Decision still needed from the client

**Multi-year pledges: follow-up pledges, or cards charged automatically?** The
site currently promises the former, and the form is built that way. Cognito
cannot do recurring billing natively — the only automated path is storing cards
and creating subscriptions manually in Stripe. Recommendation is to keep pledges
as follow-up: card fees on large multi-year gifts are significant, cards expire
inside a 36-month schedule, and gifts at this level normally arrive by check,
DAF or stock anyway.

## ALSO BUILT SINCE THE FEEDBACK (Aug 20–21, 2026)

Not from the client's list, but part of the same push and worth telling him:

**The giving form now actually takes money.** It previously could not — Stripe
was connected but nothing was switched on to use it, while the page said "pledge
by credit card". Now:

- Credit card gifts are charged through Stripe.
- Check, Donor-Advised Fund and appreciated-stock commitments submit as pledges
  **without** being forced into a card payment — his #15, solved.
- Multi-year pledges submit as pledges, no card.
- Processing fees are **off**: an $1,800 gift bills $1,800, not $1,854.
- Donors are no longer required to consent to storing their card, which the form
  had been demanding of everyone.
- Dedication buttons on the page carry the donor straight into the form with the
  dedication and amount already filled in.

**Campaign totals are now live.** Raised and goal come from a Google Sheet the
office can edit — no developer, no deploy. The budget breakdown reconciles to
the goal automatically.

**Fixes worth noting:** the form was unusable on smaller screens (the submit
button was unreachable), and the layout and typography inside it now match the
site rather than Cognito's defaults.

---

## DRAFT REPLY TO THE CLIENT

Adjust tone as needed; the structure follows the strategy above — agree loudly,
spend capital on three things, close with what you need from him.

---

Subject: Campaign site — first round of updates is live

Rabbi,

Thank you for such a careful read. Two of your catches were genuinely important
and I've made both:

You were right that "For the first time, Jewish Glencoe will have a permanent
address" isn't accurate with two established temples in town. It now reads "For
the first time, Chabad of Glencoe will have a permanent home of its own, in the
heart of the community we serve."

You were also right that the giving structure was confusing — the site had two
competing systems, four dedication groups *and* a separate ten-level recognition
wall. It's now one consistent set of four everywhere: Lead Gifts, Visionary
Gifts, Founders, Builders.

Also done:

- The Building Dedication is now first among the Lead Gifts and styled as the
  premier opportunity.
- The Front Door Mezuzah is removed.
- "What a building makes possible" now comes before the 589 Vernon details, under
  "The Future We're Building". "Square footage is not the point" is gone, and
  your three rewritten themes are in — I trimmed a few repeated phrases so they
  don't echo each other, worth a read.
- "100% locally funded" has moved up beside the campaign progress, presented as
  community ownership rather than a footnote.
- The Hebrew School wing no longer specifies two classrooms.
- The campaign budget and the $2,295,840 goal are untouched.

Two things beyond your list that I think matter:

**The donation form now works.** It previously couldn't actually take a credit
card. Donors can now give by card, or commit by check, donor-advised fund or
appreciated stock without being pushed into a card payment — which is what you
asked for. I also turned off the processing-fee surcharge, so a $1,800 gift is
billed $1,800.

**Campaign progress updates itself.** The raised figure and goal now come from a
spreadsheet your office controls, so you can update the thermometer any time
without going through me.

A few questions before I go further:

1. **Multi-year pledges** — should these be recorded as pledges your team follows
   up on, or do you want cards charged automatically each year? The site
   currently promises the former. Worth deciding deliberately, since it changes
   what donors are agreeing to.
2. **Accessible entry** — you asked to remove it. I've left it for now: if the
   renovation does include a ramp, I'd keep it, since older members and anyone
   with mobility issues are donors too. Your call.
3. **The $3,600 giving level** disappeared when we consolidated to four
   categories. Fine to lose, or should it stay?
4. **Building Dedication** — is there a figure for it, or does it stay as
   "Reserved"?

On three of your suggestions I'd push back, and I'd rather say so than quietly
not do them:

**The hero.** I'd keep "a private living room" and "589 Vernon Avenue" in the
opening paragraph. The headline you're keeping — "at last a home of its own" —
only lands if the reader knows there isn't one yet. Your new opening is warmer,
so I'd like to merge them rather than swap wholesale.

**The sticky donor sidebar.** I'd advise against it. The design is built on
full-width photography, and a rail that follows the page down crops every one of
those images. With a handful of confirmed names it will also read as empty, which
signals a stalled campaign. I'd rather give the donors a proper section with room
to look substantial — and if you want something persistent, a slim progress bar
does that without touching the layout.

**Total number of sections.** Between Why Now, renderings, momentum, the video,
the founding generation and a donor section, the page roughly doubles in length.
That pushes the donate button a long way down. I'd like to build them one at a
time and see how the page feels rather than adding all six at once.

To keep moving, I need from you:

- **Photographs — 25 to 30 if possible.** This is the real blocker on your
  photography notes. The site currently has five, which is why the Hebrew School
  and community shots repeat. I can't show the full range of ages you want
  without more to choose from.
- Confirmed donor names and levels, when you're ready to publish them.
- Renderings, as they come.
- The community video after the parlor meeting — the section is already built and
  hidden, so it's one switch when the file exists.
- Campaign committee names.

Best,
Mendel

---

## Suggested reply strategy

He led with genuine enthusiasm and did real work. Two catches are worth thanking
him for directly (the Reform temples line, the duplicate tier systems) — that buys
the credibility to push on the hero.

Structure: agree loudly on ~12 items, then spend capital on exactly three:
1. Hero specificity — do not lose the living room and the address
2. No sticky sidebar — offer the better alternative rather than refusing
3. Section count — frame it as protecting the design he already loves

NOTE (Aug 21, 2026): the original advice here was to open with the payment
blocker. That is now resolved, so the draft reply above instead opens with his
two strongest catches and reports the working payment flow as a win. Payment is
no longer what stands between him and launching — photographs are. Close with a "what I need from you" list —
photos, confirmed donor names, renderings, video — so the four blocked items
visibly return to his court.
