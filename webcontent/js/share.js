const db = require('./webcontent/models/models');

var supportedFiles = ['png', 'gif', 'jpg', 'jpeg', 'webp', 'bmp', 'rar', 'zip', 'mp4', 'mkv', 'avi', 'webm', 'ogg'];

var config = {
    recents: [],
    recentMax: 50,
    favId: 1,
    lastDir: "",
    scanFolder: [],
    imgScale: 0.6,
    sortBy: "Name-D",
    pageAnimation: "Slide",
    animDuration: 200,
    volume: 0,
    isMuted: false,
    paused: true,
    hidecontrolduration: 1,
    playerkey: {
        nextfile: {
            name: "PageDown",
            keycode: 34,
            isctrl: false
        },
        previousfile: {
            name: "PageDown",
            keycode: 33,
            isctrl: false
        },
        forward: {
            name: "ArrowRight",
            keycode: 39,
            isctrl: false
        },
        rewind: {
            name: "ArrowLeft",
            keycode: 37,
            isctrl: false
        },
        playpause: {
            name: "Space",
            keycode: 32,
            isctrl: false
        },
        fullscreen: {
            name: "Enter",
            keycode: 13,
            isctrl: false
        },
        volumeup: {
            name: "ArrowUp",
            keycode: 38,
            isctrl: false
        },
        volumedown: {
            name: "ArrowDown",
            keycode: 40,
            isctrl: false
        },
        volumemute: {
            name: "m",
            keycode: 77,
            isctrl: false
        }
    }
}

var currentView = 1;
var currentDir = "";
var currentFile;
window.onbeforeunload = (e) => {
    local.setObject('config', config);
}

ipcRenderer.on('save-file', (e) => {
    local.setObject('config', config);
    updateFile(currentFile).then(() => {
        ipcRenderer.send('close', currentFile);
    });
});

if (local.hasObject('config')) {
    var oldConfig = local.getObject('config');
    for (var key in config) {
        if (oldConfig[key] == undefined) {
            oldConfig[key] = config[key];
        }
    }
    config = oldConfig;
}

toggleView = (view) => {
    currentView = view;
    $('body').attr("viewer", view);
    if (view === 1) {
        fileViewerInit();
        filesList = [];
        loadList('current-list', []);
    } else {
        fileViewerCleanUp();
    }
}

reloadList = (filter) => {
    if (filesList.length == 0) {
        filesList = WinDrive.ListFiles(currentDir, filter)
            .map((f) => {
                return {
                    Name: f.FileName
                }
            });
        loadList('current-list', filesList, true);
    }
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
        filters: [{
            name: 'All Files',
            extensions: ['*']
        },
        {
            name: 'Images',
            extensions: ['jpg', 'png', 'gif', 'bmp']
        },
        {
            name: 'Movies',
            extensions: ['mkv', 'avi', 'mp4', 'ogg']
        },
        {
            name: 'Mangas',
            extensions: ['zip', 'rar']
        }
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
    // $('.v-vol').removeClass('vol-show');
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
                // $('.v-vol').addClass('vol-show');
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

updateItemProgress = (file) => {
    updateFile(file);
    if (file != undefined) {
        let $item, index;
        if (file.Name != undefined) {
            $item = $('.items:textequalto(' + file.Name + ')');
            if (file.Current > 0 && !imagesFilter.includes($item.data('ex'))) {
                let $itemf = $item.find('.item-file');
                let current = file.Current,
                    total = file.Total;
                if (videoFilter.includes($item.data('ex'))) {
                    current = formatTime(current);
                    total = formatTime(total);
                } else {
                    current++;
                }
                $itemf.find('.file-page').attr('data-pages', current + '/' + total);

                if (current + 1 >= total) {
                    $itemf.find('.file-page').removeClass('bg-danger').addClass('bg-primary');
                } else {
                    $itemf.find('.file-page').removeClass('bg-primary').addClass('bg-danger');
                }


            }
            index = $('.items').index($item[0]);
        }
        return index;
    }
}

updateFile = async (file) => {
    if (file != undefined && file.Id != undefined) {
        await db.db.query(`UPDATE files set Current = ${file.Current}, Total = ${file.Total} WHERE Id = ${file.Id};`);
    }
}

updateRecents = () => {
    let tempM = config.recents.removeBy(currentFile, "Name");
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
    if (e.dataTransfer.files.length > 0) {
        var f = e.dataTransfer.files[0];
        if (f != undefined) {
            if (fs.lstatSync(f.path).isDirectory()) {
                currentDir = f.path
                loadDirectory('');
            } else {
                processFile(f.name);
            }
        }
    }
    e.preventDefault();
    e.stopPropagation();
};

document.ondrop = dropFile;
$(document).on('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
});

$('.cancel-footer').on('mousedown click keyup keydown keypress wheel', consumeEvent);

$(document).on('webkitfullscreenchange', (e) => {
    if (document.webkitIsFullScreen) {
        $(document).on('mousemove', hideFooter);
        hideFooter();
    } else {
        $(document).off('mousemove', hideFooter);
        showCursor();
    }
});