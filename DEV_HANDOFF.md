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
  dataUrl: "",
  fallbackGoal: 2295840,
  fallbackRaised: 620000,
  showVideo: false,
  videoUrl: "",
  showCommittee: true,
};
```

When `dataUrl` is set, `app.js` fetches a public CSV without caching. Accepted formats are documented in `DEPLOYMENT.md`. If the fetch or validation fails, the fallback totals remain visible and the error is logged to the console.

`showCommittee` currently leaves the “Committee in formation” section visible. Set it to `false` until real names are ready if the placeholder should not launch publicly.

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

Verified against the live form schema via the Cognito MCP on Aug 20, 2026
(form 202, schema Version 5, `Metadata.Source: "mcp"`).

### Corrected diagnosis

An earlier note in this file said to "enable collection on Total pledge amount"
without specifying how, and a working assumption during the Aug 20 session was
that `TotalPledgeAmount` was a plain Number field requiring a new Price field to
be added. Both readings were imprecise. The schema shows:

```json
"DataType": "Currency",
"FieldType": "Currency",
"FieldName": "TotalPledgeAmount",
"CollectPayment": false
```

It is already a Currency field, and Currency fields carry their own
`CollectPayment` property. **No Price field needs to be added.** The blocker is
that one property being `false`.

Note that Cognito's public documentation describes the Price field as the
payment-collecting field type and does not clearly document `CollectPayment` on
Currency fields. The live schema is the authority here, not the docs.

### Stripe is already connected

```json
"PaymentAccount": {
  "Id": "da929282-c6bc-4478-9693-1a582ad7eec6",
  "Name": "Chabad of Glencoe",
  "ProcessorName": "Stripe"
},
"PaymentEnabled": false,
"PaymentMode": "Live"
```

The gateway is wired up correctly. Nothing is switched on to use it.

### RequirePayment will break pledges as currently set

```json
"RequirePayment": "true"
```

This is hardcoded true. Ticking Collect Payment without changing it means every
submission demands a card, which breaks the Check and Other pledge paths the
client asked for.

These payment settings accept Cognito `=` formulas. The form already contains a
working example, which is the syntax to copy:

```
"SaveCustomerCard": "=(!YourCommitment.HowWouldYouLikeToGive.Contains(\"full\"))"
```

### No PaymentMethod field exists

The client's request for a Credit Card / Check / Other selector requires creating
a new Choice field. It is not present in the schema.

### The MCP cannot make these changes

Available tools are `get_forms`, `get_form_schema`, `get_entry`,
`get_entries_in_view`, `get_entry_views`, `create_entry`, `update_entry`,
`delete_entry`, `get_file`, `get_document`, `set_form_availability`,
`generate_form`, and `save_generated_form`.

There is no update-form tool. `save_generated_form` CREATES a form from a
`generate_form` session; running it would produce a new form with a new ID and
break the embed URL hardcoded in `index.html` and `app.js`. Do not use it to try
to edit form 202. The MCP is read-only for schema purposes, which is still
useful — one `get_form_schema` call is faster and more accurate than clicking
through the builder.

### Steps to complete in the Cognito builder

1. Select `Total pledge amount` and enable **Collect payment**.
2. Add a Choice field `PaymentMethod` with options Credit Card, Check, Other.
3. Set **Require payment** to a formula so a card is only demanded for card
   gifts paid in full, approximately:
   `=(YourCommitment.HowWouldYouLikeToGive = "Give in full today") and (YourCommitment.PaymentMethod = "Credit Card")`
4. Rename the `Dedication` choice `Bimah, Entrance Mezuzah - $36,000` to
   `Bimah - $36,000` to match the page. Until this is done the Bimah button will
   not preselect. See the Cognito Forms integration section above.
5. Delete the three generated instructional Content blocks in the Payment
   section ("Secure payment note", "Complete My Commitment", "Confirmation
   message") once the real workflow copy is configured.
6. Confirm whether installment choices are follow-up pledges or actual recurring
   payments. `SaveCustomerCard` currently saves the card for non-"full"
   selections, which implies later charging.

### Untested assumption in step 3

It is confirmed that `RequirePayment` accepts a formula. It is NOT confirmed
whether a Currency field with Collect Payment enabled will allow submission when
Require Payment evaluates false, or whether it still insists on a card because
the field carries a non-zero amount. If it insists, condition the charged amount
rather than the requirement.

Test before trusting: a Check pledge, an Other pledge, an installment pledge, one
small live card gift, confirmation email delivery, and the internal entry data.

Do not represent card processing as live until those checks pass.

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

