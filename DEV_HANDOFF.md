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

Cognito prefill values must match the schema exactly.

The root section is `YourCommitment`, containing:

- `PresetAmount`: `$1,800`, `$5,400`, `$18,000`, or `$36,000`.
- `TotalPledgeAmount`: number.
- `HowWouldYouLikeToGive`: `Give in full today`, `Over 12 months`, `Over 24 months`, or `Over 36 months`.
- `Dedication`: one of the exact strings below.
- `InHonorOrMemoryOf`: optional text.

Exact dedication values:

- `No dedication, general campaign gift`
- `Sanctuary - $360,000`
- `Kiddush / Program Room - $250,000`
- `Aron Kodesh - $180,000`
- `Hebrew School Wing - $150,000`
- `Kitchen - $120,000`
- `Rabbi's Study, Porch, Patio - $100,000`
- `Classroom, Executive Office - $54,000`
- `Bimah - $36,000`
- `Podium, Talis Rack - $18,000`
- `Shul Bookshelf - $10,000`
- `Mezuzah - $5,400`
- `Dedicate a Brick - $1,800`

ACTION REQUIRED IN COGNITO: the `Dedication` choice `Bimah, Entrance Mezuzah - $36,000` must be renamed to `Bimah - $36,000`. The entrance mezuzah has been privately committed and was removed from the page on Aug 20, 2026. Until Cognito is updated, selecting Bimah will fail to preselect.

If a dedication name or amount changes in either Cognito or `index.html`, update both sides. `cognitoEntry()` constructs the option string from `data-dedication` plus the formatted `data-amount` value.

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

Payment was switched on between Aug 20 and Aug 21 (schema Version 5 to 7):

```json
"TotalPledgeAmount": { "DataType": "Currency", "CollectPayment": true },
"PaymentEnabled": true,
"PaymentAccount": { "Name": "Chabad of Glencoe", "ProcessorName": "Stripe" },
"PaymentMode": "Live"
```

Stripe is connected and the order builds correctly. Entering $1,800 produces a
real order with a Stripe card element. **The card fields are not missing.**

An earlier working assumption in this project — that `TotalPledgeAmount` was a
Number field and a separate Price field had to be added — was wrong. Currency
fields carry their own `CollectPayment` property. Note that Cognito's public
documentation presents the Price field as the payment-collecting field type and
does not clearly document `CollectPayment` on Currency fields. **The live schema
is authoritative here, not the docs.**

### Four problems remain, all live right now

Observed on the public form with $1,800 entered:

```
Card Authorization  *(required)
[ ] I agree to save my card for future transactions.

Total pledge amount   $1,800.00
Subtotal:             $1,800.00
Processing Fees:         $54.07
Amount Due:           $1,854.07
```

**1. The section renders as "Card Authorization", not a payment.** Caused by:

```json
"SaveCustomerCard": "=(!YourCommitment.HowWouldYouLikeToGive.Contains(\"full\"))"
```

On a fresh load nothing is selected, so `HowWouldYouLikeToGive` is null,
`null.Contains("full")` is false, the `!` flips it true, and Cognito switches the
whole section into save-card-for-later mode. This null case is also the most
likely source of the browser console error:

```
Error encountered while running rule
"Forms.FormEntry.SholomWolberg.ChabadOfGlencoeCapitalCampaign20262027.rebuildOrderRule"
```

**2. The save-card consent checkbox is required.** `.cog-payment__save-card` has
`is-required`. No donor can submit without agreeing to let Chabad of Glencoe
charge their card for future payments — including someone giving once today. This
contradicts the form's own copy, which says installments are "recorded as a
pledge for campaign-team follow-up."

**3. Processing fees are passed to the donor.** `IncludeProcessingFees: true`
turns an $1,800 gift into $1,854.07 due. This was inherited from the generated
form, not chosen. Decide deliberately: absorb the roughly 3 percent, or present
it as an opt-in checkbox. Silently surcharging donations will generate
complaints.

**4. `RequirePayment` is hardcoded `"true"`.** Every submission demands a card,
so the Check and Other pledge paths the client asked for cannot work.

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

### Fixes, in order

1. **Set Keep Card on File (`SaveCustomerCard`) to `Never`.** Not a smarter formula — off. The page
   copy already promises installments are follow-up pledges, so nothing should be
   saving cards. This one change removes the "Card Authorization" heading, the
   required consent checkbox, and the likely console error together.
2. **Set Process Payment (`RequirePayment`) to "When".** Build the condition with the
   Conditional Logic Builder's dropdowns. Use explicit equality rather than
   `.Contains()`, so an unselected field cannot produce the same null bug:
   `=(YourCommitment.HowWouldYouLikeToGive = "Give in full today")`
   Add `and YourCommitment.PaymentMethod = "Credit Card"` once that field exists.
3. **Add a `PaymentMethod` Choice field** (Credit Card / Check / Other). It does
   not exist yet; the client asked for it.
4. **Decide on processing fees** before any real gift is taken.
5. **Rename the `Dedication` choice** `Bimah, Entrance Mezuzah - $36,000` to
   `Bimah - $36,000`. The entrance mezuzah was privately committed and is already
   removed from the page. Until Cognito matches, that button will not preselect.
6. **Delete the three instructional Content blocks** in the Payment section
   ("Secure payment note", "Complete My Commitment", "Confirmation message") once
   real workflow copy is configured.

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
- Amounts outside the four presets still populate `TotalPledgeAmount` without selecting an incorrect preset.
- Modal close, Escape, backdrop click, and focus return work.
- The iframe resizes enough to expose the submit button.
- Mobile uses one column where intended and has no horizontal overflow.
- Submission, payment/pledge routing, confirmation page, confirmation email, and entry values work in Cognito.

## Deployment notes

The project can be deployed to any static host. Upload the files without changing their relative paths. HTTPS is required for production payment behavior.

Google Fonts and Cognito are external runtime dependencies. A restrictive Content Security Policy must allow the Google font origins and Cognito frame/script origins. If a CDN caches `cognito-form.css` or `app.js`, purge it after form-related changes because both files affect the iframe appearance and prefill behavior.

