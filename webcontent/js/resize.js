var resizeEl;


$('body').on('mousedown', '.resize', (e) => {
    if (e.target.classList.value.indexOf('resize') > -1)
        resizeEl = e.target;
});

$(document).mousemove((e) => {
    if (resizeEl != undefined) {
        var x = e.clientX - resizeEl.offsetLeft;
        var y = e.clientY - resizeEl.offsetTop;
        if (x < $(window).width() - resizeEl.offsetLeft) {
            resizeEl.style.width = x + "px";
        }
        
        if (y < $(window).height() - resizeEl.offsetTop - 44) {
            resizeEl.style.height = y + "px";
        }
        resize();
    }
});

$(document).mouseup((e) => { resizeEl = undefined });

/****************Resize*******************************************/
function resize() {
    $('#content').css('height', window.innerHeight);

    let $modal = $('.modal');
    $('.list-file-content').css({
        height: $modal.height() - 93
    });

    if ($modal[0].offsetTop < 48) $modal.css({
        top: 48,
        bottom: 46
    });

    if ($modal.height() > window.innerHeight - 93) {
        $modal.css({
            height: window.innerHeight - 93
        });
    }
    resizeImage();
}


$(window).on('resize', resize);
viewerImg.onload = resizeImage;