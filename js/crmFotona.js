/**
 * crmFotona.js — Pure HTML form submission handler
 * - Honeypot anti-spam
 * - Rate limiting (30s cooldown)
 * - Timestamp validation (min 1s fill time)
 * - Client-side validation
 * - GTM dataLayer push
 * - User feedback + redirect to thank-you.html
 */
(function () {
	'use strict';

	// Record page load time for timestamp validation
	var pageLoadTime = Date.now();

	// Google Apps Script endpoint
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
	 * Show feedback message after the form
	 */
	function showFeedback(form, message, type) {
		// Remove any existing feedback
		var old = form.parentNode.querySelector('.crm-feedback');
		if (old) old.remove();

		var bgColor = '#e6f7f5'; // light teal background for success
		var borderColor = '#487E89'; // var(--accent) / aqua border for success
		var textColor = '#2c3e50'; // dark text

		if (type === 'error') {
			bgColor = '#fdf4f4'; // light red background
			borderColor = '#e74c3c'; // red border
		}
		if (type === 'warning') {
			bgColor = '#fffbf0'; // light orange background
			borderColor = '#f39c12'; // orange border
		}

		var feedback = document.createElement('div');
		feedback.className = 'crm-feedback';
		feedback.style.cssText = 'margin-top:15px; padding:14px 20px; border-radius:8px; border-left:4px solid ' + borderColor + '; color:' + textColor + '; font-weight:500; font-size:15px; text-align:left; background-color:' + bgColor + '; box-shadow: 0 4px 12px rgba(0,0,0,0.05); line-height: 1.4; transition: all 0.3s ease;';
		feedback.textContent = message;

		form.parentNode.insertBefore(feedback, form.nextSibling);

		// Auto-remove error/warning messages after 5s
		if (type === 'error' || type === 'warning') {
			setTimeout(function () {
				feedback.style.transition = 'opacity 0.3s';
				feedback.style.opacity = '0';
				setTimeout(function () { feedback.remove(); }, 300);
			}, 5000);
		}
	}

	/**
	 * Handle form submission
	 */
	function handleSubmit(e) {
		e.preventDefault();

		var form = e.target;
		var submitBtn = form.querySelector('input[type="submit"]');

		// --- HONEYPOT CHECK ---
		var honeypotVal = form.querySelector('input[name="_company_fax"]').value;
		if (honeypotVal && honeypotVal.trim() !== '') {
			// Bot detected — silently pretend success
			showFeedback(form, '✅ Grazie! La tua richiesta è stata inviata.', 'success');
			return;
		}

		// --- RATE LIMIT CHECK ---
		var lastSubmit = parseInt(localStorage.getItem('crm_last_submit') || '0', 10);
		var now = Date.now();
		if (now - lastSubmit < COOLDOWN_MS) {
			showFeedback(form, '⏳ Attendi qualche secondo prima di reinviare.', 'warning');
			return;
		}

		// --- TIMESTAMP VALIDATION (anti-bot) ---
		var fillTime = now - pageLoadTime;
		if (fillTime < MIN_FILL_MS) {
			showFeedback(form, '⏳ Elaborazione in corso... attendi qualche istante e riprova.', 'warning');
			return;
		}

		// --- COLLECT VALUES ---
		var nome = form.querySelector('input[name="nome"]').value || '';
		var email = form.querySelector('input[name="email"]').value || '';
		var telefono = form.querySelector('input[name="telefono"]').value || '';
		var privacy = form.querySelector('input[name="privacy"]');

		// --- CLIENT-SIDE VALIDATION ---
		if (nome.trim().length < 2) {
			showFeedback(form, '❌ Inserisci il tuo nome e cognome.', 'error');
			return;
		}
		if (!isValidEmail(email)) {
			showFeedback(form, '❌ Inserisci un indirizzo email valido.', 'error');
			return;
		}
		if (!isValidPhone(telefono)) {
			showFeedback(form, '❌ Inserisci un numero di telefono valido (minimo 6 cifre).', 'error');
			return;
		}
		if (privacy && !privacy.checked) {
			showFeedback(form, '❌ Devi accettare la Privacy Policy per procedere.', 'error');
			return;
		}

		// --- DISABLE BUTTON ---
		submitBtn.disabled = true;
		submitBtn.value = 'Invio in corso...';

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
				showFeedback(form, '✅ Richiesta inviata con successo! Verrai ricontattata entro 24h.', 'success');

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
				showFeedback(form, '❌ Si è verificato un errore. Riprova o contattaci al telefono.', 'error');
				submitBtn.disabled = false;
				submitBtn.value = 'RICHIEDI LA VISITA';
			});
	}

	// Attach to all .crm-form elements
	document.addEventListener('DOMContentLoaded', function () {
		var forms = document.querySelectorAll('.crm-form');
		for (var i = 0; i < forms.length; i++) {
			forms[i].addEventListener('submit', handleSubmit);
		}
	});
})();