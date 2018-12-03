
var $popup = $('#popup')

popupHide = (event) => {
    $popup.css({
        display: "none"
    }).text("");
    $popup.removeClass('popup-top');
}

popupShow = (event) => {
    if ($(event.target).hasClass('popup-msg')){
        var rect = event.target.getBoundingClientRect();
        $popup.text(event.target.textContent).css({
            display: "block",
            top: -3000,
        });

        var top = rect.top + 8 + rect.height;
        if (top + $popup.height() + 10 > window.innerHeight) {
            top = rect.top - 22 - $popup.height()
            $popup.addClass('popup-top');
        }

        $popup.css({
            top,
            left: (rect.x + rect.width / 2) - ($popup.width() / 2)
        });
    }
}

$('body').on('mouseenter', '.popup-msg', popupShow);
$('body').on('mouseleave', '.popup-msg', popupHide);