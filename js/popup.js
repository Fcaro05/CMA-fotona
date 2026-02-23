jQuery(document).ready(function($) {
    var openButton = $('.openForm');
    var closeButton = $('.closePopup span');
    var popup = $('.popupForm');
    var html = $('html');
    openButton.each(function() {
        $(this).on('click', function() {
            popup.addClass('showPopup');
            html.css('overflowY', 'hidden');
            history.pushState(null, null, "#contatti");
        });
    });
    closeButton.on('click', function() {
        popup.removeClass('showPopup');
        html.css('overflowY', 'visible');
        window.history.replaceState({}, document.title, window.location.pathname);
    });
    $(window).on('popstate', function(event) {
        if (popup.hasClass('showPopup')) {
            event.preventDefault();
            html.css('overflowY', 'visible');
            popup.removeClass('showPopup');
        }
    });
    popup.on('click', function(e) {
        var containerFormTarget = $('.innerPopup');
        var isInsideContainerForm = containerFormTarget.is(e.target) || containerFormTarget.has(e.target).length > 0;
        if (!isInsideContainerForm) {
            popup.removeClass('showPopup');
            html.css('overflowY', 'visible');
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    });
});