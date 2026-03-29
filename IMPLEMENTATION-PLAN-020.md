# Implementation Plan — Session 020
**Date planned:** 2026-03-28
**Target session:** 020 (immediate) + 021 (I-043 deferred)
**Planned by:** Audit Session 020
**Status:** READY TO IMPLEMENT

---

## Overview

This plan covers 12 issues across two forms:

| Form | Issues | Session |
|---|---|---|
| Listing creation (`landlord/new-listing.html`) | I-037, I-038, I-039, I-040, I-041, I-042 | 020 |
| Application form (`apply.html` + companions) | I-044, I-045, I-046, I-047, I-048, I-049 | 020 |
| Application form — document upload | I-043 | 021 (deferred — schema change required) |

**I-043 is deliberately deferred** — it requires a Supabase Storage upload flow, a schema
change to add `document_urls TEXT[]` to the `applications` table, and an OTP auth audit.
It must not be rushed into Session 020. All other issues are self-contained HTML/JS/Edge Function
changes with no schema dependency.

---

## Pre-Edit Protocol (mandatory before any change)

Before touching any file in this plan, the implementing agent MUST:

1. State the exact files to be touched and every file that references them
2. `grep` for any function, class, or CSS name before assuming it appears in only one file
3. Declare what will NOT be touched
4. Execute the change
5. Verify: `onclick` functions on `window`, CSS classes exist, imports valid, no hardcoded tokens,
   CSS `?v=` bumped if any CSS file changed

CSS version bump rule: If any `.css` file changes, bump its `?v=` query string in every HTML
file that loads it. Current versions: `main.css?v=3`, `mobile.css?v=4`, `admin.css?v=3`,
`landlord.css?v=3`, `listings.css?v=6`, `apply.css?v=4`, `property.css?v=8`.

---

## Session 020 — Listing Form Fixes

### I-037 — Replace `window.confirm()` with `CP.UI.cpConfirm()`

**File:** `landlord/new-listing.html` (inline `<script>` at bottom, `submitListing()` function)

**Blast radius:** Only `new-listing.html`. No other file calls `submitListing()`.

**Exact change:**

Find in `submitListing()`:
```javascript
const proceed = window.confirm(
  `A listing for this address already exists:\n\n"${existing.title}" (${existing.status})\n\nDo you want to create another listing at the same address?`
);
if (!proceed) {
```

Replace with:
```javascript
const proceed = await CP.UI.cpConfirm(
  `A listing for this address already exists: "${existing.title}" (${existing.status}). Do you want to create another listing at the same address?`
);
if (!proceed) {
```

**Note:** `submitListing()` is already `async`, so `await` is valid here.
`CP.UI.cpConfirm()` is defined in `js/cp-api.js` and available via `window.CP`.

**Verification:** Click Submit on a listing with a duplicate address. A modal dialog should
appear (not a browser native dialog). Cancelling should restore the submit button.

**Dependency:** Must be implemented together with I-040 (reordering), because the confirm
dialog will now appear before photo uploads in the corrected flow.

---

### I-038 — Add `min` attributes to numeric listing inputs

**File:** `landlord/new-listing.html` (Step 2 inputs), `SETUP.sql` (DB constraint)

**Blast radius:** `new-listing.html` only for HTML change. `SETUP.sql` for DB constraint.

**HTML changes — Step 2:**

1. `#rent` input: add `min="1"` to the existing `type="number"` input
2. `#sqft` input: add `min="0"` to the existing `type="number"` input
3. `#deposit` input: add `min="0"` to the existing `type="number"` input
4. `#appFee` already has `min="0"` — no change needed

**SETUP.sql change — add CHECK constraint to properties table:**

Find the `monthly_rent INT NOT NULL` column definition in the `properties` table CREATE statement.
After the existing column definition block (or in a separate ALTER if the table already exists),
add:

```sql
-- Add after the properties table CREATE statement, or as a separate ALTER:
ALTER TABLE properties ADD CONSTRAINT chk_monthly_rent_positive CHECK (monthly_rent > 0);
```

**Note:** The ALTER TABLE approach is preferred over modifying the CREATE TABLE inline, because
the table may already exist in production. Place this ALTER immediately after the CREATE TABLE
block for `properties` in `SETUP.sql`, inside the same transaction if one exists.

**Verification:**
- Try typing `-100` in the rent field — browser should refuse or the field should turn red
- Validate step 2 with a negative value — `validate2()` already blocks rent < 1, which is correct

---

### I-039 — Enforce description maximum length

**File:** `landlord/new-listing.html` (Step 5 textarea and `validate5()` function)

**Blast radius:** `new-listing.html` only.

**Change 1 — add `maxlength` to textarea:**

Find:
```html
<textarea class="form-textarea" id="description" rows="8" placeholder="Describe the property…" style="min-height:180px"></textarea>
```

Add `maxlength="2000"`:
```html
<textarea class="form-textarea" id="description" rows="8" maxlength="2000" placeholder="Describe the property…" style="min-height:180px"></textarea>
```

**Change 2 — add max check to `validate5()`:**

Find:
```javascript
function validate5() {
  if (!v('description') || v('description').length < 50)
    return err('Please write a description of at least 50 characters.');
  return true;
}
```

Replace with:
```javascript
function validate5() {
  if (!v('description') || v('description').length < 50)
    return err('Please write a description of at least 50 characters.');
  if (v('description').length > 2000)
    return err('Description must be 2000 characters or less.');
  return true;
}
```

**Verification:** Paste 2001 characters into the description. The textarea should hard-stop at
2000 (maxlength). If manually bypassed, the validation error should catch it on Next.

---

### I-040 — Move duplicate address check before photo uploads

**File:** `landlord/new-listing.html` (inline `<script>`, `submitListing()` function)

**Blast radius:** `new-listing.html` only.

**Current order in `submitListing()`:**
```
0. Disable submit button
0a. Await geocodePromise
0b. Resolve propId
1. Upload photos to ImageKit   ← photos uploaded here
2. Collect form data
3. Duplicate address check      ← check runs here (TOO LATE)
4. DB insert
```

**New order:**
```
0. Disable submit button
0a. Await geocodePromise
0b. Resolve propId
0c. Duplicate address check     ← moved HERE, before any uploads
1. Upload photos to ImageKit
2. Collect form data
4. DB insert
```

**Exact change:** Cut the entire duplicate detection block (the `supabase.from('properties').select(...)` query through the `if (!proceed) { ... return; }` block) from its current position after photo upload and paste it immediately after the propId resolution block (after `localStorage.setItem('cp_draft_propid', propId)`), before the `if (pendingFiles.length)` photo upload block.

**Verification:** Submit a listing with a duplicate address with no photos — the confirm dialog
should appear before any upload progress bar is shown. Submit with photos — confirm dialog
appears before upload starts.

---

### I-041 — Set minimum date on available date input

**File:** `landlord/new-listing.html` (inline `<script>`, init section)

**Blast radius:** `new-listing.html` only.

**Change:** In the script init section (near the `appFeeInput.value = ''` and title counter
wiring at the top of the module script), add:

```javascript
// Set available date minimum to today — past dates are not meaningful for new listings
const availDateInput = document.getElementById('availDate');
if (availDateInput) {
  availDateInput.min = new Date().toISOString().split('T')[0];
}
```

Place this after the `appFeeInput` wiring block and before the autosave setup.

**Verification:** Open Step 2 and click the available date field — past dates should be
greyed out in the browser's native date picker.

---

### I-042 — Add photo-not-saved warning to draft resume banner

**File:** `landlord/new-listing.html` (draft resume banner HTML in the form-card section)

**Blast radius:** `new-listing.html` only.

**Change:** Find the draft resume banner age span:

```html
<span id="resumeBannerAge" style="font-size:13px;color:#78350f;margin-left:8px"></span>
```

Add a static note directly after it:

```html
<span id="resumeBannerAge" style="font-size:13px;color:#78350f;margin-left:8px"></span>
<span style="font-size:12px;color:#92400e;display:block;margin-top:4px;">
  <i class="fas fa-exclamation-triangle" style="margin-right:4px"></i>
  Photos are not saved in drafts and will need to be re-uploaded.
</span>
```

**Verification:** Save a draft with photos, reload the page — the resume banner should show
the photo warning note.

---

## Session 020 — Application Form Fixes

### I-044 — Mask government ID number server-side

**File:** `supabase/functions/process-application/index.ts`

**Blast radius:** Edge Function only. No frontend change. No schema change (column already exists).

**Change:** Immediately after the existing `maskSSN()` function definition, add a parallel
`maskGovernmentId()` function:

```typescript
function maskGovernmentId(raw: any): string | null {
  if (!raw) return null;
  const str = String(raw).trim();
  if (str.length < 4) return null;
  return '***-' + str.slice(-4);
}
```

Then find the line where `government_id_number` is mapped into the record:

```typescript
government_id_number: formData['Government ID Number'] || formData.government_id_number || null,
```

Replace with:

```typescript
government_id_number: maskGovernmentId(formData['Government ID Number'] || formData.government_id_number),
```

**Verification:** Submit a test application with a government ID of `DL-123456789`.
The stored value in the `applications` table should be `***-6789`, not the full ID.

**Note:** This is an Edge Function change. It must be deployed to Supabase after the file
is edited. The deploy command is:
```
npx supabase functions deploy process-application --project-ref YOUR_REF
```

---

### I-045 — Resolve application fee server-side from property record

**File:** `supabase/functions/process-application/index.ts`

**Blast radius:** Edge Function only. The property query already runs to resolve `landlord_id`
— this change adds fee resolution to the same query.

**Current code** (the landlord_id resolution block):

```typescript
if (record.property_id) {
  const { data: propForLandlord } = await supabase
    .from('properties')
    .select('landlord_id')
    .eq('id', record.property_id)
    .single()
  if (propForLandlord?.landlord_id) {
    record.landlord_id = propForLandlord.landlord_id
  }
}
```

**Replace with** (add `application_fee` to the select and use it):

```typescript
if (record.property_id) {
  const { data: propForLandlord } = await supabase
    .from('properties')
    .select('landlord_id, application_fee')
    .eq('id', record.property_id)
    .single()
  if (propForLandlord?.landlord_id) {
    record.landlord_id = propForLandlord.landlord_id
  }
  // Always use the server-fetched fee — never trust the client-supplied value
  if (propForLandlord !== null) {
    record.application_fee = parseInt(propForLandlord.application_fee) || 0
    record.payment_status = record.application_fee === 0 ? 'waived' : 'unpaid'
  }
}
```

**Note:** The `payment_status` assignment must be updated here too, because it was previously
set from the client-supplied `formData.application_fee` at record construction time. Moving the
authoritative fee to this block means payment_status must be recomputed here.

**Verification:** Change the application fee on a property in the Supabase dashboard. Submit
an application for that property from a browser tab that was opened before the fee change.
The stored `application_fee` on the application record should reflect the current fee, not
the old cached one.

**Deploy:** Same as I-044 — requires Edge Function redeploy.

---

### I-046 — Replace `alert()` with `CP.UI.toast()` in document upload validation

**Files:** `apply.html` (inline script), `js/apply-files.js`

**Blast radius:** These two files only. No CSS changes.

**Change 1 — `apply.html` inline script (DOMContentLoaded handler):**

Find the `showFile` function inside the uploads forEach loop:

```javascript
const showFile = (file) => {
  if (!ALLOWED.includes(file.type)) {
    alert('Only JPG, PNG, or PDF files are accepted.');
    input.value = '';
    return;
  }
  if (file.size > MAX_BYTES) {
    alert('File must be 10 MB or smaller.');
    input.value = '';
    return;
  }
```

Replace both `alert()` calls:

```javascript
const showFile = (file) => {
  if (!ALLOWED.includes(file.type)) {
    (window.CP?.UI?.toast || console.error).call(window.CP?.UI, 'Only JPG, PNG, or PDF files are accepted.', 'error');
    input.value = '';
    return;
  }
  if (file.size > MAX_BYTES) {
    (window.CP?.UI?.toast || console.error).call(window.CP?.UI, 'File must be 10 MB or smaller.', 'error');
    input.value = '';
    return;
  }
```

**Simpler alternative** (acceptable if `CP.UI` is guaranteed to be loaded by the time
document upload zones are used, which it is — `cp-api.js` loads before the form is interactive):

```javascript
const showFile = (file) => {
  if (!ALLOWED.includes(file.type)) {
    CP.UI.toast('Only JPG, PNG, or PDF files are accepted.', 'error');
    input.value = '';
    return;
  }
  if (file.size > MAX_BYTES) {
    CP.UI.toast('File must be 10 MB or smaller.', 'error');
    input.value = '';
    return;
  }
```

Use the simpler form — `CP.UI` is always available by the time the user reaches Step 4.

**Change 2 — `js/apply-files.js`, `processFile()` function:**

Find:
```javascript
if (!ALLOWED.includes(file.type)) { alert('Please upload a JPG, PNG, or PDF file.'); return; }
if (file.size > MAX_SIZE)          { alert('File exceeds 10 MB. Please upload a smaller file.'); return; }
```

Replace:
```javascript
if (!ALLOWED.includes(file.type)) { CP.UI.toast('Please upload a JPG, PNG, or PDF file.', 'error'); return; }
if (file.size > MAX_SIZE)          { CP.UI.toast('File exceeds 10 MB. Please upload a smaller file.', 'error'); return; }
```

**Verification:** On Step 4, try to upload a `.txt` file — a toast notification should
appear (not a browser alert dialog). Try a file over 10MB — same.

---

### I-047 — Add `maxlength` attributes to free-text application inputs

**File:** `apply.html`

**Blast radius:** `apply.html` only. No JS changes, no CSS changes.

**Changes — add `maxlength` to the following inputs:**

| Field ID | Name | maxlength |
|---|---|---|
| `firstName` | First Name | 100 |
| `lastName` | Last Name | 100 |
| `currentAddress` | Current Address | 200 |
| `residencyStart` | Residency Duration | 100 |
| `rentAmount` | Current Rent Amount | 20 |
| `landlordName` | Current Landlord Name | 150 |
| `landlordPhone` | Landlord Phone | 20 |
| `landlordEmail` | Landlord Email | 150 |
| `previousAddress` | Previous Address | 200 |
| `previousResidencyDuration` | Previous Residency Duration | 100 |
| `previousLandlordName` | Previous Landlord Name | 150 |
| `previousLandlordPhone` | Previous Landlord Phone | 20 |
| `employer` | Employer | 150 |
| `jobTitle` | Job Title | 150 |
| `employmentDuration` | Employment Duration | 100 |
| `supervisorName` | Supervisor Name | 150 |
| `supervisorPhone` | Supervisor Phone | 20 |
| `employerAddress` | Employer Address | 200 |
| `altIncomeSource` | Alt Income Source | 200 |
| `monthlyIncome` | Monthly Income | 20 |
| `otherIncome` | Other Income | 20 |
| `ref1Name` | Reference 1 Name | 150 |
| `ref1Phone` | Reference 1 Phone | 20 |
| `ref1Email` | Reference 1 Email | 150 |
| `ref1Relationship` | Reference 1 Relationship | 100 |
| `ref2Name` | Reference 2 Name | 150 |
| `ref2Phone` | Reference 2 Phone | 20 |
| `ref2Email` | Reference 2 Email | 150 |
| `ref2Relationship` | Reference 2 Relationship | 100 |
| `emergencyName` | Emergency Contact Name | 150 |
| `emergencyPhone` | Emergency Contact Phone | 20 |
| `emergencyRelationship` | EC Relationship | 100 |
| `coFirstName` | Co-Applicant First Name | 100 |
| `coLastName` | Co-Applicant Last Name | 100 |
| `coEmail` | Co-Applicant Email | 150 |
| `coPhone` | Co-Applicant Phone | 20 |
| `coEmployer` | Co-Applicant Employer | 150 |
| `coJobTitle` | Co-Applicant Job Title | 150 |
| `coMonthlyIncome` | Co-Applicant Monthly Income | 20 |
| `coEmploymentDuration` | Co-Applicant Employment Duration | 100 |

**Fields already having maxlength — do not change:**
`govIdNumber` (50), `reasonLeaving` (500), `occupantNames` (300), `petDetails` (300),
`evictionExplain` (500), `bankruptcyExplain` (500), `criminalExplain` (500),
`contactTimeSpecific` (200), `paymentOtherText` (100), `ssn` (4), `coSsn` (4)

**Verification:** Type past the limit in any updated field — browser should stop accepting
input at the limit.

---

### I-048 — Remove income-to-rent ratio display

**Files:** `apply.html`, any apply JS file that computes the ratio

**Blast radius:** `apply.html` and whichever JS file contains `_updateRatio` or equivalent.
Must `grep` across all apply JS files before editing.

**Step 1 — grep before touching anything:**
```
grep -rn "incomeRatioResult\|ratioDisplay\|_updateRatio\|income.*ratio\|ratio.*income" js/apply*.js apply.html
```

**Step 2 — HTML change in `apply.html`:**

Find and remove the ratio result div entirely:
```html
<div id="incomeRatioResult" class="income-ratio" style="display:none;">
  <div class="income-ratio-label" data-i18n="incomeRatioLabel">Income-to-Rent Ratio:</div>
  <div class="income-ratio-value" id="ratioDisplay">0x</div>
</div>
```

Delete this entire block.

**Step 3 — JS change:**

Find the function(s) that compute and render the ratio (look for references to `ratioDisplay`
or `incomeRatioResult`). Comment out or delete:
- The ratio computation function
- Any event listeners that call it (typically wired to `#monthlyIncome` input events)
- Any call to it from `updateRatio()` or equivalent

**Do NOT remove:**
- The `#monthlyIncome` input itself
- The `#otherIncome` input itself
- Any validation that checks income is present

**Verification:** Step 3 of the application form — no ratio widget visible when income is
entered. Income fields still present and functional.

---

### I-049 — Fix contact method label and hint text

**File:** `apply.html` (Step 6, contact preferences section)

**Blast radius:** `apply.html` only. No JS changes, no CSS changes.

**Change 1 — add required indicator to label:**

Find:
```html
<label class="required" data-i18n="prefContactMethod">Preferred Contact Method</label>
```

If the `class="required"` is already there, verify the CSS renders a `*`. If the label does
not have `class="required"`, add it. If the CSS class is named differently in the apply form
(check `apply.css`), use the correct class name.

**Change 2 — update hint text:**

Find:
```html
<div class="field-hint" data-i18n="contactMethodHint">You can select both methods</div>
```

Replace with:
```html
<div class="field-hint" data-i18n="contactMethodHint">Select at least one — you can choose both</div>
```

**Note on translations:** The `data-i18n="contactMethodHint"` key is also translated in
`apply-translations.js`. After changing the English default, update the Spanish translation
for `contactMethodHint` in `apply-translations.js` to reflect the same meaning.

**Verification:** Step 6 — the label should show a `*` required indicator. The hint text
should read "Select at least one — you can choose both". Skipping both checkboxes and
clicking Next should show the validation error (behaviour unchanged).

---

## Session 021 — Deferred: I-043 Document Upload

### I-043 — Documents silently discarded — full implementation plan

**Status:** Deferred to Session 021. Do not implement in Session 020.

**Why deferred:**
This fix requires:
1. A Supabase Storage `application-docs` bucket upload using the applicant's OTP-authenticated
   JWT (the bucket is private and auth-gated)
2. A schema change: add `document_urls TEXT[]` column to the `applications` table in `SETUP.sql`
   (or use the existing `document_url TEXT` and store a JSON-encoded array)
3. An update to `process-application/index.ts` to accept and store document URLs
4. An update to `apply-submit.js` to upload documents before or during the form submission flow
5. Progress UI in the submission overlay for the upload step

**Planned implementation for Session 021:**

**Step 1 — SETUP.sql schema change:**
Add to `applications` table:
```sql
document_urls TEXT[] DEFAULT '{}',   -- Array of Supabase Storage signed paths
```
Or reuse `document_url TEXT` and store `JSON.stringify(urls_array)` for backwards compat.

**Step 2 — `apply-submit.js` — upload documents before POST:**

In `handleFormSubmit()`, after validations pass and before the main Edge Function POST,
add an upload step:

```javascript
// Upload documents to Supabase Storage before submitting
const docUrls = [];
if (this._uploadedDocs && Object.keys(this._uploadedDocs).length > 0) {
  this.updateSubmissionProgress(1, 'Uploading documents…');
  const session = await window.CP?.Auth?.getSession?.();
  const jwt = session?.access_token;
  if (!jwt) {
    // Applicant is not authenticated via OTP — skip upload, continue without docs
    console.warn('Applicant not authenticated — documents not uploaded');
  } else {
    for (const [key, file] of Object.entries(this._uploadedDocs)) {
      try {
        const ext = file.name.split('.').pop().toLowerCase();
        const path = `applications/${Date.now()}-${key}.${ext}`;
        const { data, error } = await window.CP.sb()
          .storage
          .from('application-docs')
          .upload(path, file, { upsert: false });
        if (!error && data?.path) docUrls.push(data.path);
      } catch (uploadErr) {
        console.error('Document upload failed:', uploadErr);
        // Non-fatal — continue submission without this document
      }
    }
  }
}
jsonPayload['document_urls'] = docUrls;
```

**Step 3 — `process-application/index.ts` — store document URLs:**

In the record construction block, add:
```typescript
document_urls: Array.isArray(formData.document_urls) ? formData.document_urls : [],
```

**Step 4 — Update submission progress UI:**

Add a 5th segment to the submission progress overlay for the document upload step, or
reuse segment 1 with a dynamic message. Keep the existing 4-segment structure if possible.

**Step 5 — Update `SETUP.sql`:**

Add `document_urls TEXT[] DEFAULT '{}'` to the applications table column list.
Add a comment explaining this is the Supabase Storage path array (not full URLs — paths
are used to generate signed URLs on-demand via `get-application-status`).

**Step 6 — Update `get-application-status` Edge Function:**

When returning document info to the applicant dashboard, generate signed URLs from the
stored paths:
```typescript
const docSignedUrls = [];
for (const path of (app.document_urls || [])) {
  const { data } = await supabase.storage.from('application-docs').createSignedUrl(path, 3600);
  if (data?.signedUrl) docSignedUrls.push(data.signedUrl);
}
```

**Blast radius for I-043 (full):**
`apply-submit.js`, `apply.html` (progress overlay), `SETUP.sql`,
`supabase/functions/process-application/index.ts`,
`supabase/functions/get-application-status/index.ts`

---

## Execution Order for Session 020

Execute in this exact order to minimise blast radius and avoid conflicts:

### Pass 1 — Edge Function changes (deploy independently)
1. **I-044** — `process-application/index.ts`: add `maskGovernmentId()`, apply to field
2. **I-045** — `process-application/index.ts`: fetch fee server-side in property query

Both are in the same file — make both changes in one edit, then deploy once.

### Pass 2 — `apply.html` changes (one file, multiple fixes)
3. **I-046** — Replace `alert()` in inline script with `CP.UI.toast()`
4. **I-047** — Add `maxlength` to all free-text inputs
5. **I-048** — Remove `#incomeRatioResult` div
6. **I-049** — Fix contact method label class and hint text

All in `apply.html` — group into one edit pass.

### Pass 3 — `js/apply-files.js`
7. **I-046** (part 2) — Replace `alert()` in `processFile()` with `CP.UI.toast()`

### Pass 4 — JS companion files for I-048
8. **I-048** (part 2) — Remove ratio computation from whichever apply JS file contains it
   (grep first — do not guess the file)

### Pass 5 — `apply-translations.js`
9. **I-049** (part 2) — Update `contactMethodHint` Spanish translation

### Pass 6 — `landlord/new-listing.html` (all listing form fixes in one pass)
10. **I-037** — Replace `window.confirm()` with `CP.UI.cpConfirm()`
11. **I-038** — Add `min` attributes to numeric inputs
12. **I-039** — Add `maxlength="2000"` to description textarea + update `validate5()`
13. **I-040** — Reorder `submitListing()`: move duplicate check before photo upload
14. **I-041** — Set `availDate.min` on page init
15. **I-042** — Add photo warning to draft resume banner

### Pass 7 — `SETUP.sql`
16. **I-038** (DB part) — Add `CHECK (monthly_rent > 0)` constraint

### Pass 8 — Documentation
17. Update `ISSUES.md`: mark I-037 through I-049 as RESOLVED (except I-043: DEFERRED→IN PROGRESS)
18. Update `CHANGELOG.md`: add Session 020 implementation entry
19. Update `SESSION.md`: replace with Session 020 handoff document

---

## CSS Version Bumps Required

Check after all edits whether any `.css` file was changed:

- `apply.css` — likely unchanged (no new CSS classes added by this plan)
- `landlord.css` — likely unchanged
- `main.css` — likely unchanged

If no CSS files changed, no version bumps are needed.

If any CSS file is changed during implementation (e.g. adding a `.required-star` style),
bump its `?v=` in all consumers per the CSS version bump rule in `.agents/instructions.md`.

---

## Post-Implementation Verification Checklist

After all Session 020 changes are made:

### Listing form (`landlord/new-listing.html`)
- [ ] Duplicate address confirm uses a modal (not a browser native dialog)
- [ ] Duplicate check fires before any upload progress bar appears
- [ ] Rent field rejects values less than 1
- [ ] Description textarea hard-stops at 2000 characters
- [ ] Description validation catches > 2000 characters if bypassed
- [ ] Available date picker shows past dates as disabled
- [ ] Draft resume banner shows photo warning note
- [ ] No `window.confirm()` or `alert()` calls remain in the file

### Application form (`apply.html` + companions)
- [ ] File type error on document upload shows a toast, not a browser alert
- [ ] File size error on document upload shows a toast, not a browser alert
- [ ] First Name field stops accepting input at 100 characters
- [ ] Income-to-rent ratio widget is gone from Step 3
- [ ] Contact method label shows required indicator
- [ ] Contact method hint reads "Select at least one — you can choose both"
- [ ] Spanish translation for contact method hint is updated
- [ ] No `alert()` calls remain in `apply.html` or `apply-files.js`

### Edge Function (`process-application`)
- [ ] Government ID number stored as `***-XXXX` format (not plaintext)
- [ ] Application fee on DB record reflects current property fee (not client-supplied)
- [ ] Edge Function deployed to Supabase after file changes

### SETUP.sql
- [ ] `CHECK (monthly_rent > 0)` constraint present in properties table

---

## Files To Be Changed in Session 020

| File | Changes |
|---|---|
| `landlord/new-listing.html` | I-037, I-038, I-039, I-040, I-041, I-042 |
| `apply.html` | I-046 (inline script), I-047, I-048 (HTML), I-049 |
| `js/apply-files.js` | I-046 (processFile) |
| `js/apply.js` or companion | I-048 (JS ratio removal — grep first) |
| `js/apply-translations.js` | I-049 (Spanish hint text) |
| `supabase/functions/process-application/index.ts` | I-044, I-045 |
| `SETUP.sql` | I-038 (CHECK constraint) |
| `ISSUES.md` | Status updates |
| `CHANGELOG.md` | Session 020 entry |
| `SESSION.md` | Session 020 handoff |

## Files NOT To Be Changed in Session 020

- All other HTML pages (33 total — leave untouched)
- `css/*.css` (unless a change unexpectedly requires it — bump version if so)
- `js/cp-api.js`
- `js/imagekit.js`
- Any other Supabase Edge Function
- `generate-config.js`
- `_headers`, `_redirects`
- `SETUP.sql` except the single CHECK constraint addition
