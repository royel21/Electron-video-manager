var modalconfig;

$('.tool-config').click((e) => {
    if (modalconfig == undefined) {
        modalconfig = $(template('./template/modal-config.html', {}));

        $('.content').prepend(modalconfig);
        modalconfig.find('#modal-close').click(() => {
            hideModal(modalconfig);
            modalconfig = undefined;
        });
    };

    const imgWSlide = document.getElementById('img-width');

    imgWSlide.oninput = function () {
        config.imgScale = this.value;
        $(viewerImg).css("transform", "scaleX(" + this.value + ")");
        $(tempImg).css("transform", "scaleX(" + this.value + ")");
        $('#img-width-val').text(config.imgScale);
    }

    imgWSlide.value = config.imgScale;
    $('#img-width-val').text(config.imgScale);
    positionModal(e, modalconfig);
});

hideModal = function ($modal) {
    $modal.fadeOut('fast', () => {
        $modal.remove();
    });
};

positionModal = (e, $modal) =>{
    var pos = $(e.target).offset();
    $modal.css({ display: 'block',zIndex: zIndex+10 });
    moveEl($modal[0], pos.left, (pos.top - $modal[0].offsetHeight - 10) , $modal.width(), $modal.height());
    $modal.fadeIn('slow');
};