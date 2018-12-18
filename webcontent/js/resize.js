var resizeEl;

$('body').on('mousedown', '.resize', (e) => {
    if (e.target.classList.value.includes('resize'))
        resizeEl = e.target;
});

$(document).mousemove((e) => {
    if (resizeEl != undefined) {
        var x = e.clientX - resizeEl.offsetLeft;
        var y = e.clientY - resizeEl.offsetTop;
        if (x < $(window).width() - resizeEl.offsetLeft) {
            resizeEl.style.width = x + "px";
        }
        
        if (y < $(window).height() - resizeEl.offsetTop - getMoveDif()) {
            resizeEl.style.height = y + "px";
        }
    }
});

$(document).mouseup((e) => { resizeEl = undefined });