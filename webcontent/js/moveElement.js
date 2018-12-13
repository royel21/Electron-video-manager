var modal = null;
var offset = {
    x: 0,
    y: 0,
    w: 0,
    h: 0
};
var isPressed = false;
var zindex = 100;

getMoveDif = () => currentView === 3 ? 69 : 46;

$('body').on('mousedown', '.move', (e) => {
    if ($(e.target).hasClass('move')) {
        modal = $(e.target).closest('.modal')[0];
        offset.x = e.clientX - modal.offsetLeft;
        offset.y = e.clientY - modal.offsetTop;
        offset.w = $(modal).width();
        offset.h = $(modal).height();
        isPressed = true;
        zindex++;
        $(modal).css({
            zIndex: zindex
        });
    }
});

function moveEl(el, left, top, w, h) {
    if (left < 0) {
        left = 1;
    }

    if (left + w + 3 > $(window).width()) {
        left = $(window).width() - w - 3;
    }

    if (top < 44) {
        top = 46;
    }

    if ((top + h + getMoveDif()) > $(window).height()) {
        top = $(window).height() - h - getMoveDif();
    }
    el.style.left = left + 'px';
    el.style.top = top + 'px';
}

$(document).mousemove((me) => {
    if (isPressed) {
        var left = (me.clientX - offset.x);
        var top = (me.clientY - offset.y);
        moveEl(modal, left, top, offset.w, offset.h)
    }
});

$(document).mouseup((e) => {
    isPressed = false;
});

$(()=>{

    $(window).on('resize webkitfullscreenchange', (e) => {
        $('.move').each((index, el) => {
            if ($(el).closest('.modal').css('visibility') == "visible") {
                modal = $(el).closest('.modal')[0];
                moveEl(modal, modal.offsetLeft, modal.offsetTop, $(modal).width(), $(modal).height());
                modal = null;
            }
        });
    });

    var $clock = $('.time').text(new Date().toLocaleTimeString('en-US'));
    
    setInterval(() => {
        $clock.text(new Date().toLocaleTimeString('en-US'));
    }, 1000);

});
