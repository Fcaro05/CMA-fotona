jQuery(document).ready(function($){
	$(document).on('click', ' input[type=submit].nf-element', function() {
		if($('.nf-error-msg').length === 0){
			var nome = $('input.nome').filter(function() {
                return $(this).val().trim() !== '';
            }).val();
			var email = $('input.email').filter(function() {
                return $(this).val().trim() !== '';
            }).val();
			var telefono = $('input.telefono').filter(function() {
                return $(this).val().trim() !== '';
            }).val() || '';
			var url = 'https://script.google.com/macros/s/AKfycbzYKWEdzjmAJqOCcOB2hAqMYf7x_dMSEeDc2Jtbl5An5WAYNQFrTjvv6Or-HAaL7P9xvg/exec';
			var data = {
				nome: nome,
				email: email,
				telefono: telefono,
			};
			fetch(url, {
				method: 'POST',
				mode: 'no-cors',
				body: JSON.stringify(data),
					headers: {
						'Content-Type': 'application/json'
				}
			})
			.then(response => { console.log('Risposta ricevuta'); })
			.catch(error => { console.error('Errore durante la richiesta:', error); });	
		}
	});
});