var elToMove = null;
var offset = { x: 0, y: 0, w: 0, h: 0 };
var isPressed = false;

$('body').on('mousedown', '.move', (e) => {
    if ($(e.target).hasClass('move')) {
        elToMove = $(e.target).closest('.modal')[0];
        offset.x = e.clientX - elToMove.offsetLeft;
        offset.y = e.clientY - elToMove.offsetTop;
        offset.w = $(elToMove).width();
        offset.h = $(elToMove).height();
        isPressed = true;
    }
});
function moveEl(el, left, top, w, h) {
    if (left < 0) {
        left = 1;
    }

    if (left + w + 2 > $(window).width()) {
        left = $(window).width() - w - 2;
    }

    if (top < 44) {
        top = 46;
    }

    if ((top + h + 44) > $(window).height()) {
        top = $(window).height() - h - 46;
    }
    el.style.left = left + 'px';
    el.style.top = top + 'px';
}

$(document).mousemove((me) => {
    if (isPressed) {
        var left = (me.clientX - offset.x);
        var top = (me.clientY - offset.y);
        moveEl(elToMove, left, top, offset.w, offset.h)
    }
});

$(document).mouseup((e) => { isPressed = false; });

$(window).on('resize', () => {
    $('.move').each((index, el) => {
        elToMove = $(el).closest('.modal')[0];
        moveEl(elToMove, elToMove.offsetLeft, elToMove.offsetTop, $(elToMove).width(), $(elToMove).height());
    });
});

var $clock = $('.time').text(new Date().toLocaleTimeString('en-US'));

var timerID = setInterval(() => {
   $clock.text(new Date().toLocaleTimeString('en-US'));
}, 1000);