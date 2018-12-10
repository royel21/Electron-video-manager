const db = require('./webcontent/models/models');

var supportedFiles = ['png', 'gif', 'jpg', 'jpeg', 'webp', 'bmp', 'rar', 'zip', 'mp4', 'mkv', 'avi', 'webm', 'ogg'];

var config = {
    recents: [],
    recentMax: 50,
    favId: 1,
    lastDir: "",
    scanFolder: [],
    imgScale: 0.6,
    sortBy: "",
    pageAnimation: "Slide",
    animDuration: 200,
    volume: 0,
    isMuted: false,
    paused: true,
    hidecontrolduration: 1,
};

var currentView = 1;
var currentDir = "";
var currentFile;
window.onbeforeunload = (e) => {
    if (savePlayerConfig != undefined) savePlayerConfig();
    local.setObject('config', config);
    delete config.recents
    ipcRenderer.send('console-log', config);
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
        if (currentView == 3) playerCleanUp();
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
                    if (currentView == 3) playerCleanUp();
                    loadZip(f);
                } else if (videoFilter.includes(ex)) {
                    if (currentView == 2) imageViewerCleanUp();
                    initPlayer(f);
                }
            });
    }
}


/***********************************************************/

$('.openFile').on('click', function () {

    dialog.showOpenDialog(mainWindow, {
        title: "Select the file to open",
        filters: [
            {name: 'All Files', extensions: ['*']},
            {name: 'Images', extensions: ['jpg', 'png', 'gif', 'bmp']},
            {name: 'Movies', extensions: ['mkv', 'avi', 'mp4','ogg']},
            {name: 'Mangas', extensions: ['zip','rar']}
          ],
        properties: ['openFile']
    }, function (openedFile) {
        if (openedFile !== undefined && openedFile.length > 0) {
            currentDir = path.dirname(openedFile[0]);
            processFile(path.basename(openedFile[0]));
        }
    });
});

var mouseTimer = null;
showCursor = () => {
    $('.footer').removeClass('hide-footer');
    $('#file-name').removeClass('d-none');
    $('.v-vol').removeClass('vol-show');
    $(document.body).css({
        cursor: "default"
    });
    window.clearTimeout(mouseTimer);
    mouseTimer = null;
}
hideFooter = () => {
    showCursor();
    if (document.webkitIsFullScreen) {
        mouseTimer = window.setTimeout(() => {

            if (currentView == 3 && player.paused) {
                elClass = "";
                $(document.body).css({
                    cursor: "default"
                });
            } else {
                $('.footer').addClass("hide-footer");
                $(document.body).css({
                    cursor: "none"
                });
            }

            $('#file-name').addClass('d-none');

        }, config.hidecontrolduration * 1000);
    }
}

formatTime = (time) => {
    var h = Math.floor(time / 3600);
    var min = Math.floor((time / 3600 - h) * 60);
    var sec = Math.floor(time % 60);
    return (h == 0 ? "" : String(h).padStart(2, "0") + ':') +
        String(min).padStart(2, "0") + ':' + String(sec).padStart(2, "0");
}

createSpan = (name, current, total) => {
    if (videoFilter.includes(name.split('.').pop())) {
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

updateRecents = () => {
    var tempM = config.recents.removeByName(currentFile);
    if (tempM != undefined) currentFile = tempM;

    config.recents.unshift(currentFile);
    if (config.recents.length > config.recentMax) config.recents.pop();

    if ($('#recent').is(':visible')) {
        var $li = $('#list-recent #file-' + currentFile.Id);
        $('#list-recent li').eq(0).after($li[0] == undefined ? createEntry(currentFile, true) : $li.remove());
        $('#recent-count').text(config.recents.length + "/" + config.recentMax);
    }
}

consumeEvent = (e) => {
    e.stopPropagation();
    e.cancelBubble = true;
}
dropFile = function (e) {
    if (currentView === 1 && e.dataTransfer.files.length > 0) {
        var f = e.dataTransfer.files[0];
        if (f != undefined) {
            if (fs.lstatSync(f.path).isDirectory()) {
                currentDir = f.path;
                loadDirectory('');
            } else {
                var name = path.basename(f.path);
                processFile(name);
            }
        }
    }
    consumeEvent(e);
};
$(document).on('drop', '#file-list', dropFile);

$('.cancel-footer, .modal').on('mousedown click keyup keydown keypress wheel', consumeEvent);

$(document).on('webkitfullscreenchange', () => {
    if (document.webkitIsFullScreen) {
        $(document).on('mousemove', hideFooter);
        hideFooter();
    } else {
        $(document).off('mousemove', hideFooter);
        showCursor();
    }
});