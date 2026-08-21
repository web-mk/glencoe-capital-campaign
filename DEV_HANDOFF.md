# Developer handoff

Last updated: August 19, 2026

This document records the implementation state, technical decisions, integration details, known risks, and verification steps for future development. It is a decision-oriented handoff rather than a transcript of private internal reasoning.

## Current state

The campaign site is implemented as a static HTML, CSS, and JavaScript project. There is no React application, package manager, bundler, or build step.

Local preview:

```sh
python3 -m http.server 4173
```

Open:

- Site: `http://127.0.0.1:4173/`
- Form opened automatically: `http://127.0.0.1:4173/?previewForm=1`

The source handoff files remain in the project root for reference:

- `README.md`
- `Capital Campaign.dc.html`
- `support.js`

## Why this is static instead of React

The page is a single campaign landing page with a small amount of state: campaign totals, optional sections, a modal, and Cognito prefill data. Static HTML keeps deployment simple, removes a build/runtime dependency, and makes the deliverable portable to ordinary static hosting.

React would be appropriate if this becomes a multi-page application, gains substantial client-side state, or must share a component system with another React property. At the current scope it would add tooling without improving the donor experience.

## Project map

- `index.html`: page structure, content, dedication buttons, modal, and Cognito iframe.
- `src/styles.css`: all parent-page and modal styling.
- `cognito-form.css`: CSS injected into the cross-origin Cognito form through Cognito's supported styling API.
- `app.js`: campaign data, optional-section toggles, modal behavior, Cognito styling, and prefill behavior.
- `site-config.js`: editable campaign values and feature flags.
- `img/`: site photography and logo assets.
- `DEPLOYMENT.md`: concise deployment and Cognito launch checklist.

## Design direction

The implementation follows the handoff's editorial campaign aesthetic:

- Cormorant Garamond for expressive display typography.
- Jost for labels, navigation, body copy, and controls.
- Dark brown/black, cream, burgundy, and muted gold palette.
- Large photography, restrained borders, minimal shadow, and generous spacing.
- The Cognito form is visually integrated into the modal rather than presented with its default theme.

Avoid introducing generic dashboard styling, gradients, excessive rounded cards, or unrelated component-library defaults. Preserve the existing typography and spacing rhythm when adding sections.

The closing callout containing “for the children who are not yet born” was removed in full at the user's request. Its unused CSS was removed as well. Do not restore it without new copy approval.

## Campaign data

`site-config.js` controls the campaign totals and optional sections:

```js
window.CAMPAIGN_CONFIG = {
  dataUrl: "https://data.webmk.co/?id=1U-OxKPvmGWipvQ8w_V5bfoRvFGuVbOOzV0fLHDX0uYY",
  fallbackGoal: 2295840,
  fallbackRaised: 620000,
  showVideo: false,
  videoUrl: "",
  showCommittee: true,
};
```

### Live totals from a Google Sheet

Raised and goal are fetched at page load from WebMK's JSON proxy in front of the
Google Sheets API. The client edits the sheet; the site follows. No auth, CORS is
open, and the endpoint is not CDN-cached (`cf-cache-status: DYNAMIC`).

The sheet's first row is headers and the second row is values:

```json
{"range":"Sheet1!A1:E300","majorDimension":"ROWS",
 "values":[["Raised","Goal"],["620000","2295840"]]}
```

`parseCampaignData()` in `app.js` accepts either that JSON shape or a plain CSV,
and matches **by header name, not column index**, so the client can reorder the
sheet's columns safely. Values are stripped of currency formatting, so `$620,000`
and `620000` both parse. A vertical `label,value` layout also works as a fallback.

CSV parsing is quote-aware. A naive `row.split(",")` corrupts cells like
`"2,295,840"`; `splitCsvRow()` handles quoted commas and escaped quotes.

### Fallback behaviour

`renderCampaignData()` runs synchronously with `fallbackGoal` / `fallbackRaised`
before the fetch starts, so the page always shows valid numbers. The fetched
values only replace them on success. If the fetch fails, the sheet is empty, or
the parsed goal is not greater than zero, the totals are rejected, the fallback
stays visible, and a warning is logged. Never let the progress section depend on
the fetch succeeding.

Keep `fallbackGoal` and `fallbackRaised` roughly current anyway — they are what a
visitor sees if the sheet is unreachable.

### Elements driven by the fetched totals

| Selector | Shows |
|---|---|
| `[data-raised]` | raised, compact (`$620K`) |
| `[data-goal]` | goal, compact (`$2.3M`) |
| `[data-goal-exact]` | goal, exact, in the budget breakdown (`$2,295,840`) |
| `[data-percentage]` | raised / goal, capped at 100% |
| `[data-remaining-compact]` | goal − raised, compact |
| `[data-remaining]` | goal − raised, exact |
| `.progress-track` | `aria-valuenow` and the `--progress` fill width |

`[data-goal-exact]` was added when the sheet was wired up. Without it the budget
breakdown kept a hardcoded total while the progress bar moved, so the two could
silently disagree.

### The goal must match the budget breakdown

The budget line items in the giving section are hardcoded and sum exactly to the
campaign goal:

```
1,526,500  purchase of the center
  576,950  renovations, soft costs, furnishings
  192,390  campaign and first two years of operating
---------
2,295,840  total
```

**The sheet's Goal cell must therefore be 2295840, not 2300000.** As of Aug 21,
2026 the sheet reads 2300000, which renders a total campaign goal of $2,300,000
above line items that add to $2,295,840 — a visible $4,160 gap in the one table
whose whole purpose is transparency. Either correct the sheet cell or change the
line items to match; do not leave them inconsistent.

$2.3M is fine as the rounded figure in prose and in the compact display, which is
what `formatCompactMoney()` already produces from 2295840.

## Cognito Forms integration

Form details:

- Form ID: `202`
- Internal name: `ChabadOfGlencoeCapitalCampaign20262027`
- Iframe URL: `https://www.cognitoforms.com/f/dRAaFn88o0CEV3wipoVjTA/202`
- Public URL: `https://www.cognitoforms.com/sholomwolberg/chabadofglencoecapitalcampaign20262027`
- Builder: `https://www.cognitoforms.com/sholomwolberg/chabadofglencoecapitalcampaign20262027/build?source=Mcp`

The iframe ID is `cognito-pledge-frame`. Do not change it without updating every Cognito selector in `app.js`.

### Field names and exact choice values

Current as of Cognito form 202 **schema Version 27, Aug 21, 2026**. The form was
restructured substantially on Aug 21; several earlier field names in this file's
history no longer exist. Re-read the schema through the MCP after any builder
session — `get_form_schema` with formId 202 — and reconcile `app.js` against it.

**Prices now live on the choice options themselves.** There is no longer a
free-text amount field in the main path.

`YourCommitment` section:

- `Dedication` — Choice, `ChoiceHasPrice: true`, rendered as cards. Labels are
  **bare names**, with the price carried separately:
  `Sanctuary` (360000), `Kiddush / Program Room` (250000), `Aron Kodesh` (180000),
  `Hebrew School Wing` (150000), `Kitchen` (120000),
  `Rabbi's Study, Porch, Patio` (100000), `Classroom, Executive Office` (54000),
  `Bimah` (36000), `Podium, Talis Rack` (18000), `Shul Bookshelf` (10000),
  `Mezuzah` (5400), `Dedicate a Brick` (1800),
  `No dedication, general campaign gift` (no price).
- `OtherAmounts` — Choice, `ChoiceHasPrice: true`, radio buttons:
  `$1,800`, `$5,400`, `$18,000`, `$36,000`, `Other` (price 0).
- `OtherAmount` — Currency, visible only when `OtherAmounts = "Other"`.
- `InHonorOrMemoryOf` — text.

`Payment` section:

- `ANoteToRabbiSholom` — text.
- `GiftType` — `One-time gift`, `Multi-year pledge`, `Check / stock / DAF`.
- `PaymentMethod` — `Credit Card`, `Check`, `Donor-Advised Fund`,
  `Appreciated stock`. Visible only when `GiftType = "One-time gift"`.
- `Total` — **Price** field, `CollectPayment: true`, visible when
  `PaymentMethod = "Credit Card"`:
  `=Form.YourCommitment.Dedication_Price + Form.YourCommitment.OtherAmounts_Price + Form.YourCommitment.OtherAmount`

### Fields that were deleted — do not reference them

- `TotalPledgeAmount` (Currency) — removed. Replaced by prices on choice options.
- `PresetAmount` — renamed to `OtherAmounts`.
- `HowWouldYouLikeToGive` — removed. Replaced by `GiftType`.

Each of these silently broke the site's prefill when it changed: an unknown field
name in the `entry` payload causes the whole prefill to be ignored, so nothing
preselects and the failure is invisible until someone clicks a dedication button.

### How app.js prefills against this model

Two rules, both load-bearing:

1. **Send the bare dedication label.** `"Sanctuary"`, never
   `"Sanctuary - $360,000"`. The label no longer contains the amount, so
   appending it means nothing matches.
2. **Never send an amount alongside a dedication.** The dedication already
   carries its price, and `Total` sums `Dedication_Price + OtherAmounts_Price +
   OtherAmount`, so setting both double-charges.

Amount-only buttons (the recognition tiers) map to `OtherAmounts` when the value
is one of the four presets, otherwise to `"Other"` plus a numeric `OtherAmount`.
That covers the $250,000 and $100,000 tiers, which have no preset option.

Verified in a real browser: Sanctuary preselects and totals $360,000; Mezuzah
totals $5,400; the $1,800 tier ticks the preset and totals $1,800.

### Choice option price display

The duplicated `$1,800 - $1,800.00` labels come from prices being displayed on a
field whose labels already contain the amount. The setting is
**"Show Prices in Choice Field"**, in the field's **Choice Options** section
(alongside Collect Payment, Assign Prices, Assign Values, Limit Quantities, Show
Images). It requires a single-selection type — Drop Down, Radio Buttons, or Cards.

- `OtherAmounts` — turn **off**. Labels already state the amount.
- `Dedication` — leave **on**. Labels are bare names; donors need the figure.

Purely cosmetic: the price still applies to the order either way. Note that a
choice field set to display prices does not show them when read-only.

### Why prefill uses the iframe URL

The initial implementation called Cognito's JavaScript `prefill()` method when the modal opened. The field names and values were correct, but iframe readiness made dedication selection inconsistent.

The current implementation reloads the iframe with an encoded `entry` query parameter:

```text
?entry={"YourCommitment":{...}}
```

This makes the selected amount, schedule, and dedication part of the form's initial state. A post-load `prefill()` call remains as reinforcement, and `setCss()` is reapplied after each iframe load.

Do not remove the URL payload unless the replacement is tested against a cold page load, a warm iframe, and repeated selections.

### Styling architecture and pitfalls

The iframe is cross-origin, so parent-page CSS cannot style its controls directly. `app.js` fetches `cognito-form.css` and sends it to Cognito through:

```js
Cognito("#cognito-pledge-frame").setCss(css);
```

Cognito-generated class names and field positions are used to reproduce the handoff layout. The most important selectors are scoped under `#cognito` and the first section's numbered fields.

Important layout detail: `.cog-checkable` must remain a full-width block, while its child `.el-radio-group` owns the two-column grid. Applying the two-column grid to both elements causes the radio group to occupy only the first half of the available width. This was the cause of the narrow preset amount tiles.

Dedications deliberately use the form/modal's natural vertical scroll. Do not restore `max-height` or `overflow-y: auto` on the dedication `.cog-checkable`; nested scrolling was specifically rejected.

The form currently uses a two-column desktop composition and collapses at `760px`. Cognito markup changes can break positional selectors, so retest after changing the form structure in the builder.

## Modal behavior

- Every element with `data-amount` opens the modal.
- Elements that also have `data-dedication` preselect the matching dedication.
- Recognition-level buttons have amounts but no dedication and select the general campaign option.
- The `Give or Pledge` button opens a blank/general commitment.
- Escape and backdrop click close the modal.
- Focus returns to the triggering control.
- `?previewForm=1` is a development convenience that opens the form automatically.

The modal is the only intended scroll surface around the form. Avoid adding another fixed-height scroll container inside Cognito.

## Payment launch blocker

Status as of Aug 21, 2026, verified two ways: the form schema read through the
Cognito MCP, and the live public form driven in a real browser.

### What is already done

As of Aug 21, 2026 (schema Version 27), the following are resolved and verified:

- `PaymentEnabled: true`, Stripe connected (`Chabad of Glencoe`), `PaymentMode: Live`.
- **Process Payment** (`RequirePayment`) is conditional:
  `=(Payment.PaymentMethod = "Credit Card")`.
- **Keep Card on File** (`SaveCustomerCard`) is `"false"`. This removed the
  "Card Authorization" heading, the required consent checkbox, and the
  `rebuildOrderRule` console error.
- **Processing fees are OFF** (`IncludeProcessingFees: false`). Donors are no
  longer surcharged; an $1,800 gift bills $1,800.
- The charge is a **Price** field (`Total`) whose amount is conditional, so
  pledges, checks, DAF and stock gifts submit with no order and no card fields.
- `Dedication` renamed `Bimah, Entrance Mezuzah` to `Bimah`; the entrance
  mezuzah was privately committed and is off the page.
- The generated instructional Content blocks are gone.
- A `PaymentMethod` field exists, with DAF and appreciated stock as options.

Verified end to end in a browser: selecting a dedication preselects it, the
Stripe card element renders, and the order totals correctly ($360,000 for
Sanctuary, $5,400 for Mezuzah).

### Still open

1. **Workflow status is wrong.** `Submit Commitment` has `AllowedWhen: "true"`
   and `NewStatus: 2` ("Pledge Recorded"), and the three internal actions
   (`Mark Payment Received`, `Mark Pledge Recorded`, `Request Follow-up`) are all
   `IsDeleted: true`. Every submission — including a completed credit-card
   payment — files as a pledge, and there is no action to mark payment received.
   The entry data cannot distinguish paid from promised. Confirm whether this is
   deliberate; if not, restore the internal actions and set Submit Commitment
   back to `Incomplete`.
2. **`PriceItemName` is `"="`** — an empty formula, so the order line item and
   the receipt render with no name. Set it to a literal such as
   `Capital Campaign Gift`.
3. **"Show Prices in Choice Field"** should be turned off on `OtherAmounts`;
   see the Cognito Forms integration section above.
4. **Section naming.** The Cognito section is called "Payment" and the order
   block Cognito generates is also headed "Payment", so two identical headings
   stack. Renaming the section (for example "Complete Your Gift") resolves it.
5. **Stale help text** may remain on fields referencing deleted options.

### What cannot be fixed from CSS

The Stripe card input renders inside its own cross-origin frame. Its text size
is Stripe's, and injected CSS cannot reach it. The payment section's own labels
were nudged to 15px to narrow the visual gap; that is as close as it gets.

### Where these settings actually live in the builder

Payment settings are NOT part of the Workflow builder. Workflow covers statuses,
actions, and emails only. Payment is its own area: click **"Payment" in the top
toolbar**, or click the Payment area at the bottom of the form preview.

The UI labels do not match the schema property names, which makes the settings
hard to find from a schema dump:

| Schema property | Builder label | Options |
|---|---|---|
| `RequirePayment` | **Process Payment** | Always / When (conditional) / Never (invoice only) |
| `SaveCustomerCard` | **Keep Card on File** | Always / When (conditional) / Never |
| `IncludeProcessingFees` | **Processing Fees** | pass transaction fees to the donor, with optional custom label |

Both Process Payment and Keep Card on File support conditional logic through the
Conditional Logic Builder. Prefer building conditions with the builder's
dropdowns rather than hand-writing a formula — that is how the null bug in the
existing `SaveCustomerCard` expression got in.

Keep Card on File is a Team/Enterprise plan feature.

### Why this cannot be automated from here

The Cognito MCP exposes `get_forms`, `get_form_schema`, entry CRUD, `get_file`,
`get_document`, `set_form_availability`, `generate_form`, and
`save_generated_form`. **There is no update-form tool.** `save_generated_form`
CREATES a form from a `generate_form` session; running it would produce a new
form with a new ID and break the embed URL hardcoded in `index.html` and
`app.js`. Do not point it at form 202.

Reading the schema through the MCP is still the fastest way to check state, and
the live form can be driven in Playwright to verify behaviour. Only the edits
themselves require the builder.

### Conditional charging: condition the amount, not the requirement

> HISTORICAL. This documents why conditioning Process Payment alone was not
> enough, using the `TotalPledgeAmount` Currency field that existed at the time.
> That field has since been deleted and prices moved onto the choice options,
> but the underlying lesson still applies: Collect Payment on a Currency field is
> an unconditional checkbox, so the charge must be conditioned on the amount.

Confirmed by driving the live form on Aug 21, 2026. With an amount entered, the
order summary showed `Amount Due: $1,800.00` for EVERY gift type, including
Multi-year pledge, even though `RequirePayment` was correctly conditional and no
card element rendered.

Cause: **Collect Payment on a Currency field is an unconditional checkbox.**

```json
"TotalPledgeAmount": { "DataType": "Currency", "CollectPayment": true }
```

That field contributes a line item to the order on every submission. Process
Payment (`RequirePayment`) then only decides whether a card is demanded for an
order that already exists. So the order summary always renders.

Cognito cannot conditionally collect on a Currency field — only conditionally
require payment on an order. The fix is to move the charge to a Price field whose
AMOUNT is conditional:

1. Turn **Collect Payment OFF** on `Total pledge amount`, making it a plain data
   field. Leaving it on while adding the Price field will bill twice.
2. Add a **Price** field and set its amount to a calculation. Type `=` in the
   amount box to switch from a literal to a formula. Cognito's syntax is
   `if … then … else`, not a function call:

   ```
   =if Payment.PaymentMethod = "Credit Card" then YourCommitment.TotalPledgeAmount else 0
   ```

Use **section-qualified paths**. A bare `TotalPledgeAmount` may not resolve from
inside the Payment section. Prefer the formatting toolbar's insert-field control
over typing names by hand — calculations use the field's internal name (spaces
and punctuation stripped), and hand-written expressions are what introduced the
earlier `SaveCustomerCard` null bug.

The conditional logic builder cannot do this. Its value box accepts literals
only, which is why `TotalPledgeAmount` does not appear as a selectable option
there.

### Open: GiftType and PaymentMethod overlap

`GiftType` includes `Check / stock / DAF`, but `PaymentMethod` is only visible
when `GiftType = "One-time gift"`. So when a donor selects the Check/stock/DAF
gift type, the form never captures WHICH vehicle they intend. Suggested split:

```
Gift Type:       One-time gift | Multi-year pledge
Payment Method:  Credit Card | Check | Donor-Advised Fund | Appreciated stock   (always visible)
```

Then Process Payment becomes:
`=(Payment.PaymentMethod = "Credit Card" and Payment.GiftType = "One-time gift")`

Also stale: the `Total pledge amount` help text still reads "Payment is collected
only when you select 'Give in full today'", referencing the deleted field.

### Modal scrolling

**The iframe scrolls its own document. The modal does not scroll.**

An earlier fix made the surrounding modal the scroll container. That was wrong,
and it looked correct while still being broken: it only slid a too-short iframe
around.

The real cause: Cognito's `iframe.js` sizes the iframe from **its own**
measurement of the content, but the stylesheet injected through `setCss()`
reflows that content taller afterwards — two-column dedication cards, larger
payment labels — and Cognito never re-measures. Combined with `scrolling="no"`,
the difference was unreachable. Measured with a dedication selected and the card
fields rendered:

```
iframe rendered:  1059px   (Cognito's stale height attribute)
inner document:   1644px
stranded:          585px   including the submit button
```

Current arrangement:

- `.modal-panel` — flex column with a **definite** `height:
  calc(100dvh - 2 * clamp(12px, 3vw, 48px))`. It must be `height`, not
  `max-height`: `height: 100%` on the iframe cannot resolve through the flex
  chain against an indefinite parent, and the iframe collapses to about 150px.
- `.modal-header` — sticky, `flex: none`.
- `#cognito-form` — `display: flex; flex: 1 1 auto; min-height: 0;
  overflow: hidden`. It is NOT the scroll container.
- `.cognito-frame` — `height: 100% !important`. The `!important` is required to
  beat the `height` attribute Cognito rewrites on every resize.
- `app.js` re-asserts `scrolling="yes"` on every iframe `load`, because
  `iframe.js` resets it to `"no"`.

Do not reintroduce a fixed `height` attribute on the iframe in `index.html`, and
do not make `#cognito-form` scrollable again — two nested scroll surfaces trap
the wheel gesture.

Verified with a real `mouse.wheel` gesture over the iframe that the submit button
becomes reachable. Note that measuring `scrollHeight` on the container is NOT
sufficient verification; it reports a scrollable container while the content is
still clipped inside a short iframe.

### Section heading font

Cognito emits two kinds of heading. Section headings carry both classes:

```html
<h2 class="cog-section__heading cog-heading">Payment</h2>
```

The payment/order block emits a bare one with no `cog-section__heading`:

```html
<h2 class="cog-heading">Payment</h2>
<h2 class="cog-heading">Card Authorization</h2>
```

`cognito-form.css` originally styled only `.cog-section__heading`, so the bare
headings fell through to Cognito's default Open Sans Condensed. Both rules (the
main one and the small-screen font-size override) now target
`.cog-section__heading, .cog-heading`. Verified in the live iframe: all headings
compute to Jost 11px uppercase in maroon.

Note that `.cog-heading` also matches the form's `h1` title, which is hidden by
the `.cog-header` rule, so widening the selector is safe.

**Cosmetic issue not yet resolved:** the Cognito section is named "Payment" and
the order block Cognito generates is also headed "Payment", so two identical
headings stack. Renaming the form section (for example to "Complete Your Gift")
would resolve it.

### Required test pass before launch

Nothing here is verified until all of these pass:

- A Check pledge submits without demanding a card
- An Other pledge submits without demanding a card
- An installment pledge submits and records correctly
- One small live card gift completes and settles in Stripe
- The confirmation email arrives, with correct amount and dedication
- The internal entry shows the right status, amount, and dedication
- No console error on form load

Do not represent card processing as live until those pass.

## Verification completed

The current Cognito behavior was checked in a real headless browser against the live embedded form:

- Clicking the Sanctuary page button opened the modal.
- The iframe received `Sanctuary - $360,000` and Cognito reported it as selected.
- The preset amount group measured the same width as its containing field: `665px` in the test viewport.
- Dedication computed overflow was `visible`.
- Dedication computed max height was `none`.
- Dedication client height and scroll height both measured `685px`, confirming there was no inner scroll area.
- `node --check app.js` and `git diff --check` passed after the changes.

## Regression checklist

After any form or styling change, verify at desktop and mobile widths:

- The form loads on first open and on repeated modal opens.
- Preset amounts fill the commitment column in a two-by-two grid.
- Giving schedule fills the commitment column.
- Every dedication is visible without nested scrolling.
- Each dedication card on the page selects the exact matching Cognito option.
- Recognition amounts populate the amount and general-gift option.
- Amounts outside the four presets select `OtherAmounts: "Other"` and populate a numeric `OtherAmount`.
- Selecting a dedication does NOT also set an amount (that would double the total).
- The submit button is reachable by scrolling with the cursor over the iframe.
- Modal close, Escape, backdrop click, and focus return work.
- The iframe resizes enough to expose the submit button.
- Mobile uses one column where intended and has no horizontal overflow.
- Submission, payment/pledge routing, confirmation page, confirmation email, and entry values work in Cognito.

## Asset cache busting

`index.html` loads `src/styles.css`, `site-config.js` and `app.js` with a
`?v=YYYYMMDD` query string:

```html
<link rel="stylesheet" href="src/styles.css?v=20260821" />
<script src="site-config.js?v=20260821" defer></script>
<script src="app.js?v=20260821" defer></script>
```

**Bump the version whenever any of those three files changes.** All three share
one token; there is no need to track them separately.

This exists because browser caching repeatedly produced false bug reports during
development. A CSS fix would be verified as correct in one browser session and
then appear completely broken in another, because the old stylesheet was still
being served. A normal refresh does not clear it; only a hard reload
(Cmd+Shift+R) or DevTools with "Disable cache" enabled does. Playwright's
`page.reload()` does NOT bypass the cache either, so automated verification can
be fooled the same way — force fresh headers when testing a CSS change.

Quick check that a stylesheet actually loaded, from the browser console:

```js
getComputedStyle(document.getElementById('cognito-form')).overflowY
// "auto"    = current stylesheet
// "visible" = stale cache
```

`cognito-form.css` does not need a version token. `app.js` fetches it with
`cache: "no-store"` and injects it through Cognito's `setCss()` API, so it is
never served from the browser cache.

Note that a CDN in front of this site will cache these files too. See the
deployment notes below on purging after form-related changes.

## Deployment notes

The project can be deployed to any static host. Upload the files without changing their relative paths. HTTPS is required for production payment behavior.

Google Fonts and Cognito are external runtime dependencies. A restrictive Content Security Policy must allow the Google font origins and Cognito frame/script origins. If a CDN caches `cognito-form.css` or `app.js`, purge it after form-related changes because both files affect the iframe appearance and prefill behavior.

