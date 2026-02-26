/**
 * crmFotona.js — Form submission handler
 * - Honeypot anti-spam
 * - Rate limiting (60s cooldown)
 * - Timestamp validation (min 3s fill time)
 * - Client-side validation
 * - User feedback + redirect to thank-you.html
 */
jQuery(document).ready(function ($) {

	// Record page load time for timestamp validation
	var pageLoadTime = Date.now();

	// Google Apps Script endpoint (existing)
	var ENDPOINT = 'https://script.google.com/macros/s/AKfycbyJMTTuud9jOm4tXPA2sVwmHJ0_Nhl7lfd7GsiMymV6GCP_TZYCDGi-Vm3Lk2o6SgRj/exec';

	// Cooldown in milliseconds
	var COOLDOWN_MS = 30000; // 30 seconds

	// Minimum fill time in milliseconds (anti-bot)
	var MIN_FILL_MS = 1000; // 1 second

	/**
	 * Simple email regex validation
	 */
	function isValidEmail(email) {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	}

	/**
	 * Phone validation: at least 6 digits
	 */
	function isValidPhone(phone) {
		var digits = phone.replace(/\D/g, '');
		return digits.length >= 6;
	}

	/**
	 * Show feedback message near the submit button
	 */
	function showFeedback(formContainer, message, type) {
		// Remove any existing feedback
		formContainer.find('.crm-feedback').remove();

		var bgColor = '#27ae60'; // default success green
		if (type === 'error') bgColor = '#e74c3c'; // red
		if (type === 'warning') bgColor = '#f39c12'; // orange

		var feedback = $('<div class="crm-feedback" style="' +
			'margin-top:12px;padding:12px 16px;border-radius:6px;' +
			'color:#fff;font-weight:600;font-size:14px;text-align:center;' +
			'background:' + bgColor + ';">' + message + '</div>');

		formContainer.find('.nf-form-cont').after(feedback);

		// Auto-remove error/warning messages after 5s
		if (type === 'error' || type === 'warning') {
			setTimeout(function () { feedback.fadeOut(300, function () { $(this).remove(); }); }, 5000);
		}
	}

	/**
	 * Get the closest form container (works for both inline and popup forms)
	 */
	function getFormContainer(submitBtn) {
		return submitBtn.closest('.colFormVisita, .innerPopup');
	}

	/**
	 * Main submit handler
	 * Attached to document to catch dynamically rendered Ninja Forms submit buttons
	 */
	$(document).on('click', 'input[type=submit].nf-element', function (e) {
		var $btn = $(this);
		var formContainer = getFormContainer($btn);

		// Wait a tick for Ninja Forms validation to run
		setTimeout(function () {
			// If Ninja Forms shows validation errors, don't proceed
			if (formContainer.find('.nf-error-msg').length > 0) {
				return;
			}

			// --- HONEYPOT CHECK ---
			var honeypotVal = formContainer.find('input[name="_company_fax"]').val();
			if (honeypotVal && honeypotVal.trim() !== '') {
				// Bot detected — silently pretend success
				showFeedback(formContainer, '✅ Richiesta inviata con successo! Verrai ricontattata entro 24h.', 'success');
				return;
			}

			// --- RATE LIMIT CHECK ---
			var lastSubmit = parseInt(localStorage.getItem('crm_last_submit') || '0', 10);
			var now = Date.now();
			if (now - lastSubmit < COOLDOWN_MS) {
				showFeedback(formContainer, '⏳ Attendi qualche secondo prima di reinviare.', 'warning');
				return;
			}

			// --- TIMESTAMP VALIDATION (anti-bot) ---
			var fillTime = now - pageLoadTime;
			if (fillTime < MIN_FILL_MS) {
				// Filled too fast — likely a bot or over-eager autofill, neutral warning
				showFeedback(formContainer, '⏳ Elaborazione in corso... attendi qualche istante e riprova.', 'warning');
				return;
			}

			// --- COLLECT VALUES ---
			var nome = formContainer.find('input.nome').val() || '';
			var email = formContainer.find('input.email').val() || '';
			var telefono = formContainer.find('input.telefono').val() || '';

			// --- CLIENT-SIDE VALIDATION ---
			if (nome.trim().length < 2) {
				showFeedback(formContainer, '❌ Inserisci il tuo nome e cognome.', 'error');
				return;
			}
			if (!isValidEmail(email)) {
				showFeedback(formContainer, '❌ Inserisci un indirizzo email valido.', 'error');
				return;
			}
			if (!isValidPhone(telefono)) {
				showFeedback(formContainer, '❌ Inserisci un numero di telefono valido (minimo 6 cifre).', 'error');
				return;
			}

			// --- DISABLE BUTTON ---
			$btn.prop('disabled', true).val('Invio in corso...');

			// --- SEND DATA ---
			var data = {
				nome: nome.trim(),
				email: email.trim(),
				telefono: telefono.trim(),
				timestamp: new Date().toISOString()
			};

			fetch(ENDPOINT, {
				method: 'POST',
				mode: 'no-cors',
				body: JSON.stringify(data),
				headers: {
					'Content-Type': 'application/json'
				}
			})
				.then(function () {
					// With no-cors we can't read response, but if no error it went through
					localStorage.setItem('crm_last_submit', String(Date.now()));
					showFeedback(formContainer, '✅ Richiesta inviata con successo! Verrai ricontattata entro 24h.', 'success');

					// GTM / Analytics tracking event
					window.dataLayer = window.dataLayer || [];
					window.dataLayer.push({ event: 'lead_submit_success' });

					// Redirect to thank-you page after 2 seconds
					setTimeout(function () {
						window.location.href = 'thank-you.html';
					}, 2000);
				})
				.catch(function (error) {
					console.error('Errore durante la richiesta:', error);
					showFeedback(formContainer, '❌ Si è verificato un errore. Riprova o contattaci al telefono.', 'error');
					$btn.prop('disabled', false).val('RICHIEDI LA VISITA');
				});

		}, 200); // 200ms delay for NF validation
	});
});