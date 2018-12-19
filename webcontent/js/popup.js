var $popup = $('#popup')

popupHide = (event) => {
    $popup.css({
        display: "none"
    }).text("");
    $popup.removeClass('popup-top');
}

popupShow = async (event) => {
    if ($(event.target).hasClass('popup-msg')) {
        var rect = event.target.getBoundingClientRect();
        var msg = event.target.dataset.title;
        var li = $(event.target).closest('li')[0];
        if (li != undefined) {
            var file = await db.File.findOne({
                where: {
                    Id: li.id.replace('file-', '')
                },
                include: { model: db.Folder }
            });
            if (file) {
                msg = path.join(file.folder.Name, file.Name);
            }
        }
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

$('body').on('mousemove', '.popup-msg', popupShow);
$('.footer .popup-msg').on('mousemove', popupShow);
$('.footer .popup-msg').on('click', popupHide);
$('body').on('mouseleave wheel', '.popup-msg', popupHide);