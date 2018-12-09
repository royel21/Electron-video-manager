const db = require('./webcontent/models/models');

var config = {
    recents: [],
    recentMax: 50,
    favId: 1,
    lastDir: "",
    scanFolder: [],
    imgScale: 0.6,
    sortBy: "",
    pageAnimation: "Slide",
    animDuration: 200
};

var currentView = 1;
var currentDir = "";
// window.onbeforeunload = (e) => {
//     if (savePlayerConfig != undefined) savePlayerConfig();
//     if (saveImageViewer != undefined)  saveImageViewer();
// }
window.onunload = function (e) {
    local.setObject('config', config);
    if (savePlayerConfig != undefined) savePlayerConfig();
    if (saveImageViewer != undefined) saveImageViewer();
}
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
        db.File.findByName({
                Name: name
            })
            .then((f) => {
                if (f == null) f = {
                    Name: name,
                    folder: {
                        Name: currentDir
                    }
                };
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

var mouseTimer = null,
    cursorVisible = true;
showCursor = () => {
    $('.footer').removeClass('hide-footer');
    $('#file-name').removeClass('d-none');
    $('.v-vol').removeClass('vol-show');
    if (mouseTimer) {
        window.clearTimeout(mouseTimer);
    }
    if (!cursorVisible) {
        $(document.body).css({
            cursor: "default"
        });
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
                $(document.body).css({
                    cursor: "none"
                });
                cursorVisible = false;
            } else {
                showCursor();
            }
        }, playerConfig.hideCtrSecond * 1000);
    }
}

formatTime = (time) => {
    var h = Math.floor(time / 3600);
    var min = Math.floor((time / 3600 - h) * 60);
    var sec = Math.floor(time % 60);
    return (h == 0 ? "" : String(h).padStart(2, "0") + ':') +
        String(min).padStart(2, "0") + ':' + String(sec).padStart(2, "0");
}

createSpan = (name, current, total) =>{
    if(videoFilter.includes(name.split('.').pop())){
        current = formatTime(current);
        total = formatTime(total);
    }
    return `<span class="file-page ${current == total ? "bg-primary" : "bg-danger"}"` +
                ` data-pages="${current}/${total}"></span>`;
}

updateItemProgress = (file) => {
    if (file != undefined) {
        var $item, index;
        if (file.Name != undefined) {
            $item = $('.items:textequalto(' + file.Name + ')');
            if (file.Current > 0 && !isImage) {
                var $itemf = $item.find('.item-file');
                $itemf.find('.file-page').remove();
                $itemf.append(createSpan(file.Name, file.Current + 1, file.Total));
            }
            index = $('.items').index($item[0]);
        }
        return index;
    }
}

updateFile = (file) => {
    if (file != undefined && file.Id != undefined && !imagesFilter.includes(file.Name.toLocaleLowerCase().split('.').pop())) {
        return db.db.query(`UPDATE files set Current = ${file.Current}, Total = ${file.Total} WHERE Id = ${file.Id};`)
    }
}

$('.cancel-footer').on('mousedown click keyup keydown keypress', consumeEvent);
$(document).on('mousemove', hideFooter);
$(document).on('webkitfullscreenchange', hideFooter);