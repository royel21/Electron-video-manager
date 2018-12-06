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
    if(view === 1) fileViewerInit();
}

processFile = (name) => {
    fileViewerCleanUp();
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
            });
    }
}

consumeEvent = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.cancelBubble = true;
    console.log("event consume")
}

var mouseTimer = null, cursorVisible = true;
hideFooter = () => {
    if (document.webkitIsFullScreen) {
        $('.footer').removeClass('hide-footer');
        if (mouseTimer) {
            window.clearTimeout(mouseTimer);
        }
        if (!cursorVisible) {
            $(document.body).css({ cursor: "default" });
            cursorVisible = true;
        }

        mouseTimer = window.setTimeout(() => {
            var elClass = "hide-footer";
            mouseTimer = null;
            if (currentView === 3 && player.paused) {
                elClass = "";
            }

            if (document.webkitIsFullScreen) {
                $('.footer').addClass(elClass);
                $(document.body).css({ cursor: "none" });
                cursorVisible = false;
            }
            console.log("test2",elClass)
        }, playerConfig.hideCtrSecond * 1000);
        console.log("test1")
    }
}

$('.cancel-footer').on('mousedown click mouseup keyup keydown keypress', consumeEvent);
$(document).on('mousemove', hideFooter);
$(document).on('webkitfullscreenchange', hideFooter);