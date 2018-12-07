const db = require('./webcontent/models/models');
var currentView = 1;
var currentDir = "";
$(window).on('beforeunload', (e) => {
    local.setObject('config', config);
    local.setObject('playerconfig', playerConfig);
});

if (local.hasObject('config')) {
    config = local.getObject('config');
}

toggleView = (view) => {
    currentView = view;
    $('body').attr("viewer", view);
    view === 1 ? fileViewerInit() : fileViewerCleanUp();
}

processFile = (name) => {
    var ex = name.split('.').pop().toLocaleLowerCase();
    
    if (imagesFilter.includes(ex)) {
        loadImage(name);
    } else {
        db.File.findByName({Name: name})
            .then((f) => {
                if (f == null) f = { Name: name, folder: { Name: currentDir } };
                if (compressFilter.includes(ex)) {
                    loadZip(f);
                } else if (videoFilter.includes(ex)) {
                    initPlayer(f);
                }
                hideFooter();
            });
    }
}

consumeEvent = (e) => {
    e.stopPropagation();
    e.cancelBubble = true;
}

var mouseTimer = null, cursorVisible = true;
showCursor = () =>{
    $('.footer').removeClass('hide-footer');
    $('#file-name').removeClass('d-none');
    if (mouseTimer) {
        window.clearTimeout(mouseTimer);
    }
    if (!cursorVisible) {
        $(document.body).css({ cursor: "default" });
        cursorVisible = true;
    }
}
hideFooter = () => {
    if (document.webkitIsFullScreen) {
        showCursor();
        mouseTimer = window.setTimeout(() => {
            var elClass = "hide-footer";
            mouseTimer = null;
            if (currentView === 3 && player.paused) {
                elClass = "";
            }

            if (document.webkitIsFullScreen) {
                $('.footer').addClass(elClass);
                $('#file-name').addClass('d-none');
                $(document.body).css({ cursor: "none" });
                cursorVisible = false;
            }else{
                showCursor();
            }
        }, playerConfig.hideCtrSecond * 1000);
    }
}

$('.cancel-footer').on('mousedown click keyup keydown keypress', consumeEvent);
$(document).on('mousemove', hideFooter);
$(document).on('webkitfullscreenchange', hideFooter);