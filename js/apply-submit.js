// Choice Properties — apply-submit.js
// Form submission logic for the RentalApplication class.
// Loaded before apply.js. Applied via Object.assign(RentalApplication.prototype, ...) at end of apply.js.
//
// Methods provided:
//   isTransientError(error)                    — returns true for network/timeout errors eligible for auto-retry
//   showSubmissionError(error, isTransient)    — displays error state, schedules auto-retry if transient
//   getCurrentSubmissionStep()                 — returns the currently active progress step (1–4) or null
//   updateSubmissionProgress(step, msg)        — updates the 4-step progress bar UI
//   handleFormSubmit(e)                        — main submit handler: validates, builds payload, calls Edge Function
//   showSubmissionProgress()                   — shows the progress overlay, hides the form
//   hideSubmissionProgress()                   — hides the progress overlay, restores the form
//   showDuplicateBanner(existingId)            — shows inline duplicate-application banner; returns Promise<'dashboard'|'resubmit'>
//   handleSubmissionSuccess(appId)             — clears draft, stores appId, redirects to success page

/* global window, CONFIG */
window.APPLY_SUBMIT = {

    isTransientError(error) {
        const msg = error.message || error.toString();
        return msg.includes('network') ||
               msg.includes('timeout') ||
               msg.includes('Failed to fetch') ||
               msg.includes('ECONNREFUSED') ||
               msg.includes('Internet') ||
               msg.includes('offline');
    },

    // ---------- showSubmissionError with auto-retry ----------
    showSubmissionError(error, isTransient = false) {
        const msgEl = document.getElementById('submissionMessage');
        const progressDiv = document.getElementById('submissionProgress');
        const statusArea = document.getElementById('statusArea');
        const spinner = document.getElementById('submissionSpinner');
        if (!msgEl || !progressDiv || !statusArea) return;

        const t = this.getTranslations();
        const errorMessage = error.message || error.toString();

        if (this.retryTimeout) {
            clearTimeout(this.retryTimeout);
            this.retryTimeout = null;
        }

        // Auto-retry for transient errors
        if (isTransient && this.retryCount < this.maxRetries) {
            const delay = Math.pow(2, this.retryCount) * 1000; // 2, 4, 8 seconds
            this.retryCount++;

            msgEl.innerHTML = `${errorMessage} – ${t.retry} in ${delay/1000}s (attempt ${this.retryCount}/${this.maxRetries})`;
            statusArea.classList.add('error');
            if (spinner) {
                spinner.className = 'fas fa-spinner fa-pulse';
                spinner.style.color = '#e74c3c';
            }

            this.retryTimeout = setTimeout(() => {
                this.retryTimeout = null;
                statusArea.classList.remove('error');
                if (spinner) {
                    spinner.className = 'fas fa-spinner fa-pulse';
                    spinner.style.color = '';
                }
                this.updateSubmissionProgress(1, t.processing);
                this.handleFormSubmit(new Event('submit'));
            }, delay);
            return;
        }

        // Permanent error or max retries reached
        msgEl.innerHTML = errorMessage;
        statusArea.classList.add('error');
        if (spinner) {
            spinner.className = 'fas fa-exclamation-circle';
            spinner.style.color = '#e74c3c';
        }

        const currentStep = this.getCurrentSubmissionStep();
        if (currentStep) {
            const stepItem = document.getElementById(`stepItem${currentStep}`);
            if (stepItem) stepItem.classList.add('error');
        }

        let retryBtn = document.getElementById('submissionRetryBtn');
        if (!retryBtn) {
            retryBtn = document.createElement('button');
            retryBtn.id = 'submissionRetryBtn';
            retryBtn.className = 'btn btn-retry';
            retryBtn.innerHTML = `<i class="fas fa-redo-alt"></i> ${t.retry}`;
            retryBtn.style.marginTop = '15px';
            retryBtn.style.padding = '10px 20px';
            retryBtn.style.background = 'var(--secondary)';
            retryBtn.style.color = 'white';
            retryBtn.style.border = 'none';
            retryBtn.style.borderRadius = 'var(--border-radius)';
            retryBtn.style.cursor = 'pointer';
            progressDiv.appendChild(retryBtn);
        }
        retryBtn.style.display = 'inline-block';

        const newBtn = retryBtn.cloneNode(true);
        retryBtn.parentNode.replaceChild(newBtn, retryBtn);
        newBtn.addEventListener('click', () => {
            newBtn.style.display = 'none';
            statusArea.classList.remove('error');
            if (spinner) {
                spinner.className = 'fas fa-spinner fa-pulse';
                spinner.style.color = '';
            }
            if (currentStep) {
                const stepItem = document.getElementById(`stepItem${currentStep}`);
                if (stepItem) stepItem.classList.remove('error');
            }
            this.retryCount = 0;
            this.updateSubmissionProgress(1, t.processing);
            this.handleFormSubmit(new Event('submit'));
        });
    },

    getCurrentSubmissionStep() {
        for (let i = 1; i <= 4; i++) {
            const seg = document.getElementById(`progressSegment${i}`);
            if (seg && seg.classList.contains('active')) return i;
        }
        return null;
    },

    // ---------- updateSubmissionProgress ----------
    updateSubmissionProgress(step, customMessage) {
        const t = this.getTranslations();
        const messages = {
            1: t.processing,
            2: t.validating,
            3: t.submitting,
            4: t.complete
        };
        const msg = messages[step] || customMessage || '';
        const msgEl = document.getElementById('submissionMessage');
        if (msgEl) msgEl.textContent = msg;

        for (let i = 1; i <= 4; i++) {
            const seg = document.getElementById(`progressSegment${i}`);
            const stepItem = document.getElementById(`stepItem${i}`);
            if (seg) {
                seg.classList.remove('completed', 'active');
                if (i < step) seg.classList.add('completed');
                else if (i === step) seg.classList.add('active');
            }
            if (stepItem) {
                stepItem.classList.remove('completed', 'active', 'error');
                if (i < step) stepItem.classList.add('completed');
                else if (i === step) stepItem.classList.add('active');
            }
        }

        const spinner = document.getElementById('submissionSpinner');
        if (step === 4 && spinner) {
            spinner.className = 'fas fa-check-circle';
            spinner.style.color = '#27ae60';
        } else if (spinner) {
            spinner.className = 'fas fa-spinner fa-pulse';
            spinner.style.color = '';
        }
    },

    // ---------- handleFormSubmit with retry reset ----------
    async handleFormSubmit(e) {
        e.preventDefault();

        this.retryCount = 0;
        if (this.retryTimeout) {
            clearTimeout(this.retryTimeout);
            this.retryTimeout = null;
        }

        if (!navigator.onLine) {
            const t = this.getTranslations();
            this.showSubmissionError(new Error(t.offlineError), false);
            const submitBtn = document.getElementById('mainSubmitBtn');
            if (submitBtn) { submitBtn.classList.remove('loading'); submitBtn.disabled = false; }
            this.setState({ isSubmitting: false });
            return;
        }

        // FCRA consent check
        const fcraConsent = document.getElementById('fcraConsent');
        if (fcraConsent && !fcraConsent.checked) {
            const fcraErr = document.getElementById('fcraConsentError');
            if (fcraErr) fcraErr.style.display = 'block';
            fcraConsent.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const submitBtn = document.getElementById('mainSubmitBtn');
            if (submitBtn) { submitBtn.classList.remove('loading'); submitBtn.disabled = false; }
            this.setState({ isSubmitting: false });
            return;
        }
        if (fcraConsent) {
            const fcraErr = document.getElementById('fcraConsentError');
            if (fcraErr) fcraErr.style.display = 'none';
        }

        // Legal declaration checkboxes
        const certify = document.getElementById('certifyCorrect');
        const authorize = document.getElementById('authorizeVerify');
        const terms = document.getElementById('termsAgree');
        if (!certify.checked || !authorize.checked || !terms.checked) {
            let legalErr = document.getElementById('legalDeclarationError');
            if (!legalErr) {
                legalErr = document.createElement('div');
                legalErr.id = 'legalDeclarationError';
                legalErr.className = 'error-message';
                legalErr.style.cssText = 'display:block;margin-top:10px;font-size:13px;';
                const legalSection = document.querySelector('.legal-checkbox-group');
                if (legalSection) legalSection.after(legalErr);
            }
            legalErr.textContent = this.t('errLegalDeclarations');
            legalErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const submitBtn = document.getElementById('mainSubmitBtn');
            if (submitBtn) { submitBtn.classList.remove('loading'); submitBtn.disabled = false; }
            this.setState({ isSubmitting: false });
            return;
        }
        const legalErr = document.getElementById('legalDeclarationError');
        if (legalErr) legalErr.textContent = '';

        // Step validation (all steps 1–5)
        for (let i = 1; i <= 5; i++) {
            if (!this.validateStep(i)) {
                this.showSection(i);
                this.updateProgressBar();
                return;
            }
        }

        // SSN validation (step 6)
        const ssnField = document.getElementById('ssn');
        if (ssnField && !this.validateField(ssnField)) {
            ssnField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        const hasCoApp = document.getElementById('hasCoApplicant');
        if (hasCoApp && hasCoApp.checked) {
            const coSsnField = document.getElementById('coSsn');
            if (coSsnField) {
                const coSsnVal = coSsnField.value.replace(/\D/g, '');
                if (!coSsnVal || coSsnVal.length < 4) {
                    this.showError(coSsnField, this.t('errSSNRequired'));
                    coSsnField.classList.add('is-invalid', 'shake');
                    setTimeout(() => coSsnField.classList.remove('shake'), 400);
                    coSsnField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return;
                }
            }
        }

        const submitBtn = document.getElementById('mainSubmitBtn');
        if (submitBtn) { submitBtn.classList.add('loading'); submitBtn.disabled = true; }
        this.setState({ isSubmitting: true });
        this.showSubmissionProgress();

        try {
            const t = this.getTranslations();
            this.updateSubmissionProgress(1, t.processing);

            const form = document.getElementById('rentalApplication');
            // Build JSON payload — collect multi-value checkboxes as arrays
            const rawFormData = new FormData(form);
            const jsonPayload = {};
            const multiFields = ['Preferred Contact Method'];
            rawFormData.forEach((value, key) => {
                if (multiFields.includes(key)) {
                    if (!jsonPayload[key]) jsonPayload[key] = [];
                    if (!Array.isArray(jsonPayload[key])) jsonPayload[key] = [jsonPayload[key]];
                    jsonPayload[key].push(value);
                } else {
                    jsonPayload[key] = value;
                }
            });
            multiFields.forEach(f => { if (!jsonPayload[f]) jsonPayload[f] = []; });

            // Strip currency formatting from income fields
            ['Monthly Income', 'Other Income', 'Co-Applicant Monthly Income', 'Current Rent Amount'].forEach(k => {
                if (jsonPayload[k]) jsonPayload[k] = jsonPayload[k].replace(/[^0-9.]/g, '');
            });

            // Resolve property and landlord IDs
            const urlParams = new URLSearchParams(window.location.search);
            const selectedPropId = this._selectedPropertyId
                || document.getElementById('propertySelect')?.value
                || urlParams.get('propertyId');
            if (selectedPropId) {
                jsonPayload['listing_property_id'] = selectedPropId;
                const propData = this._properties && this._properties[selectedPropId];
                jsonPayload['application_fee'] = propData ? (parseInt(propData.application_fee) || 0) : 0;
                if (propData && propData.landlord_id) jsonPayload['landlord_id'] = propData.landlord_id;
            }
            if (urlParams.get('landlordId') && !jsonPayload['landlord_id']) jsonPayload['landlord_id'] = urlParams.get('landlordId');

            jsonPayload['preferred_language'] = this.state.language || 'en';

            this.updateSubmissionProgress(2, t.validating);

            const response = await fetch(this.BACKEND_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': CONFIG.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify(jsonPayload)
            });

            const result = await response.json();
            if (result.app_id) result.appId = result.app_id;

            // Property no longer active (HTTP 410)
            if (response.status === 410 && result.property_inactive) {
                throw new Error(
                    'This property is no longer accepting applications — it may have been filled or removed. ' +
                    'Please return to our listings to find an available property.'
                );
            }

            // Duplicate application detected (HTTP 409)
            if (response.status === 409 && result.duplicate && result.existing_app_id) {
                this.hideSubmissionProgress();
                const userChoice = await this.showDuplicateBanner(result.existing_app_id);
                if (userChoice === 'dashboard') {
                    window.location.href = `/apply/dashboard.html?id=${result.existing_app_id}`;
                    return;
                }
                const submitBtn2 = document.getElementById('mainSubmitBtn');
                if (submitBtn2) { submitBtn2.classList.remove('loading'); submitBtn2.disabled = false; }
                this.setState({ isSubmitting: false });
                return;
            }

            if (result.ok) {
                this.updateSubmissionProgress(3, t.submitting);
                await this.delay(500);
                this.updateSubmissionProgress(4, t.complete);
                await this.delay(500);
                this.handleSubmissionSuccess(result.appId);
            } else {
                throw new Error(result.error || 'Submission failed');
            }

        } catch (error) {
            console.error('Submission error:', error);
            const submitBtn2 = document.getElementById('mainSubmitBtn');
            if (submitBtn2) { submitBtn2.classList.remove('loading'); submitBtn2.disabled = false; }
            this.setState({ isSubmitting: false });
            const isTransient = this.isTransientError(error);
            this.showSubmissionError(error, isTransient);
        }
    },

    // ---------- show/hide progress overlay ----------
    showSubmissionProgress() {
        const progress = document.getElementById('submissionProgress');
        const backdrop = document.getElementById('modalBackdrop');
        const form = document.getElementById('rentalApplication');
        if (progress) progress.style.display = 'block';
        if (backdrop) backdrop.style.display = 'block';
        if (form) form.style.display = 'none';
    },

    hideSubmissionProgress() {
        const progress = document.getElementById('submissionProgress');
        const backdrop = document.getElementById('modalBackdrop');
        const form = document.getElementById('rentalApplication');
        if (progress) progress.style.display = 'none';
        if (backdrop) backdrop.style.display = 'none';
        if (form) form.style.display = 'block';
    },

    // ---------- Inline duplicate banner ----------
    showDuplicateBanner(existingId) {
        return new Promise((resolve) => {
            const old = document.getElementById('duplicateBanner');
            if (old) old.remove();

            const banner = document.createElement('div');
            banner.id = 'duplicateBanner';
            banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;background:#fffbeb;border-bottom:3px solid #f59e0b;padding:20px 24px;box-shadow:0 4px 24px rgba(0,0,0,0.12);display:flex;align-items:center;gap:16px;flex-wrap:wrap;';
            banner.innerHTML = `
                <div style="flex:1;min-width:220px;">
                    <div style="font-weight:700;font-size:15px;color:#92400e;margin-bottom:4px;">⚠️ Existing Application Found</div>
                    <div style="font-size:13px;color:#78350f;line-height:1.5;">You already have an active application for this property. Your Application ID is <strong style="font-family:monospace;">${existingId}</strong>.</div>
                </div>
                <div style="display:flex;gap:10px;flex-shrink:0;">
                    <button id="dupGoDash" style="background:#f59e0b;color:#fff;border:none;border-radius:6px;padding:10px 18px;font-weight:700;font-size:13px;cursor:pointer;">Track Existing Application</button>
                    <button id="dupResubmit" style="background:#fff;color:#92400e;border:1.5px solid #f59e0b;border-radius:6px;padding:10px 18px;font-weight:700;font-size:13px;cursor:pointer;">Submit New Anyway</button>
                </div>`;

            document.body.prepend(banner);
            window.scrollTo({ top: 0, behavior: 'smooth' });

            document.getElementById('dupGoDash').addEventListener('click', () => { banner.remove(); resolve('dashboard'); });
            document.getElementById('dupResubmit').addEventListener('click', () => { banner.remove(); resolve('resubmit'); });
        });
    },

    handleSubmissionSuccess(appId) {
        this.hideSubmissionProgress();
        this.clearSavedProgress();
        sessionStorage.setItem('lastSuccessAppId', appId);

        // Pass fee as URL param so success.html shows correct fee/no-fee messaging
        // even when sessionStorage is unavailable (e.g. mobile browser clearing session).
        const propCtx = (() => { try { return JSON.parse(sessionStorage.getItem('cp_property_context') || '{}'); } catch(e) { return {}; } })();
        const feeParam = propCtx.application_fee !== undefined ? `&fee=${encodeURIComponent(propCtx.application_fee)}` : '';
        window.location.href = `/apply/success.html?appId=${encodeURIComponent(appId)}${feeParam}`;
    },

};
