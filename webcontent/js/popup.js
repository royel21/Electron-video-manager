var $popup = $('#popup')

popupHide = (event) => {
    $popup.css({
        display: "none"
    }).text("");
    $popup.removeClass('popup-top');
}

popupShow = (event) => {
    if ($(event.target).hasClass('popup-msg')) {
        var rect = event.target.getBoundingClientRect();
        var msg = event.target.dataset.title;
        $popup.css({
            display: "block",
            top: -3000,
        }).text(msg == undefined ? event.target.textContent : msg);

        var top = rect.top + 8 + rect.height;
        if (top + $popup.height() + 10 > window.innerHeight) {
            top = rect.top - 22 - $popup.height()
            $popup.addClass('popup-top');
        }

        $popup.css({
            top,
            left: (rect.x + rect.width / 2) - ($popup.width() / 2) - 9
        });
    }
}

$('body').on('mousemove wheel', '.popup-msg', popupShow);
$('.footer .popup-msg').on('mousemove', popupShow);
$('body').on('mouseleave', '.popup-msg', popupHide);