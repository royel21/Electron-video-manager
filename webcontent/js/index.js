var selectedIndex = 0;
var totalitem = 0;
var allFiles;
var contentScroll = $('.content').get(0);
var processRunning = 0;
var folderIcon = path.join('./webcontent/image/Folder.png');
var zipIcon = path.join('./webcontent/image/zip.png');
var videoIcon = path.join('./webcontent/image/video.png');
var $cmenu = $('#context-menu');
var favs = [];
var folderId = null;
var supportedFiles = ['png', 'gif', 'jpg', 'jpeg', 'webp', 'bmp', 'rar', 'zip', 'mp4', 'mkv', 'avi', 'webm', 'ogg'];
var backgroundImage = [];
var compressingCount = 0;
var $fviewer = $('#file-viewer');
var filesList = [];
var fileFound = [];
var currentDir = "";
var $loading = $('#folder-reloading');

ipcRenderer.on('thumb-create', (event, name) => {
    var item = $('.items:textequalto(' + name + ')').find('img')[0];
    if (item != undefined &&
        item.offsetTop < $(window).height() + $(item).closest('.items').height()) {

        var icon = './covers/' + name.replace('#', '%23') +
            (videoFilter.includes(name.split('.').pop()) ? '.png' : '.jpg');
        item.dataset.src = icon;
        item.src = icon;
    }
});

ipcRenderer.on('error', (event, msg) => {
    console.log(msg);

    if (String(msg).includes("Scan")) {
        $loading.find('.fa-database').addClass('d-none');
    } else
        if (String(msg).includes("Thumbnail Create")) {
            --processRunning;
            if (processRunning == 0)
                $loading.find('.fa-folder').addClass('d-none');
            backgroundImage = [];
        }
});

ipcRenderer.on('files-removed', (e, index) => {
    var $item = $('.items:eq(' + index + ')');
    $item.fadeOut(80, () => {
        $item.remove();
        $('#loadingDiv').addClass('d-none');
    });
    totalitem = $('.items').length;
    $filescount.text('Files: ' + totalitem);
    $(selectItem(index - 1 < 0 ? 0 : index - 1));
});

ipcRenderer.on('zip-done', (e, result) => {
    compressingCount--;

    if (compressingCount == 0) $('.fa-file-archive').addClass('d-none');

    if (path.dirname(result.dir) === currentDir) {
        $('#file-list').append(CreateEl(result.file))
        sortElements();
    }
});

loadDirectory = async (folder, id) => {
    var dir = folder != '' ? path.join(currentDir, folder) : currentDir;
    var fol = await db.Folder.findOne({
        where: { $or: [{ Id: id }, { Name: dir }] }
    });

    if (fol != null) {
        folderId = fol.Id;
        dir = fol.Name;
    } else {
        folderId = null;
    }
    try {
        if (fs.lstatSync(dir).isDirectory()) {
            await loadFavs();
            currentDir = dir;
            var files = [];
            var folders = [];
            WinDrive.ListFiles(dir).forEach((f) => {
                var name = f.FileName.toLocaleLowerCase();
                if (!f.isHidden) {
                    if (f.isDirectory && name.includes(boxFilter)) {
                        folders.push(f);
                    } else {
                        if (supportedFiles.includes(f.extension)
                            && name.includes(boxFilter))
                            files.push(f);
                    }
                }
            });
            totalitem = folders.length + files.length;
            var documentFragment = document.createDocumentFragment();
            folders.concat(files).forEach((f) => {
                documentFragment.append(CreateEl(f));
            });
            var flist = document.getElementById('file-list');
            flist.innerHTML = "";
            flist.append(documentFragment);
            $('.title').text(dir);
            selectedIndex = 0;
            lazyLoad();
            setTimeout(() => {

                var tFiles = files.filter(f => {
                    var fv = path.resolve("./covers", f.FileName);
                    return compressFilter.concat(videoFilter).includes(f.extension) &&
                        !fs.existsSync(fv + ".jpg") && !fs.existsSync(fv + ".png") && backgroundImage.find(f2 => f2.FileName === f.FileName) == undefined
                });

                if (tFiles.length > 0) {
                    $loading.find('.fa-folder').removeClass('d-none');
                    createBackgroundWin('create-cover', { files: tFiles });
                    backgroundImage = backgroundImage.concat(tFiles);
                    processRunning++;
                }

                localStorage.setItem('currentDir', currentDir);
                $filescount.text('Files: ' + totalitem);
                filesList = allFiles = files.map(a => a.FileName);
                selectItem(selectedIndex);
            });
        }
    } catch (error) {
        goToRoots();
        console.log(error)
    }
    toggleView(1);
};


returnFolder = async () => {
    if (currentDir.length === 0) return;
    var dir = path.parse(currentDir).base
    currentDir = path.parse(currentDir).dir
    if (dir === '') {
        goToRoots();
    } else {
        await loadDirectory('');
    }
    var item = $('.items:textequalto(' + dir + ')');
    selectItem($('.items').index(item[0]));
}

jumpToFile = (e) => {
    if (currentView === 1 && !e.ctrlKey) {
        var char = String.fromCharCode(e.charCode);
        if (char.match(/^[0-9a-zA-Z|\[|(]+$/ig)) {
            var $firstEl = $('.items').filter(function () {
                return $(this).text().trim()[0].toLocaleUpperCase() === char.toLocaleUpperCase();
            });
            if ($firstEl[0] != undefined)
                selectItem($('.items').index($firstEl));
        }
    }
}

keyboardHandler = (e) => {
    if (currentView === 1) {
        var wasProcesed = false;
        switch (e.keyCode) {
            case 13:
                {
                    if (e.ctrlKey) {
                        setfullscreen();
                    } else {
                        var $el = $(document.activeElement);
                        var name = $el.data('name');

                        if ($el.data('isfile')) {
                            processFile(name);
                        } else {
                            loadDirectory(name);
                        }
                    }
                    wasProcesed = true;
                    break;
                }
            case 37:
                {
                    if (e.ctrlKey) {
                        JumpFolder(-1);
                    } else {
                        if (selectedIndex > 0) {
                            selectItem(selectedIndex - 1);
                        } else {
                            selectItem(totalitem - 1);
                        }
                    }
                    wasProcesed = true;
                    break;
                }
            case 38:
                {
                    if (e.ctrlKey) {
                        returnFolder();
                    } else if (selectedIndex - calCol() >= 0) {
                        selectItem(selectedIndex - calCol());
                    }
                    wasProcesed = true;
                    break;
                }
            case 39:
                {
                    if (e.ctrlKey) {
                        JumpFolder(1);
                    } else if (selectedIndex < totalitem - 1) {
                        selectItem(selectedIndex + 1);
                    } else {
                        selectItem(0);
                    }
                    wasProcesed = true;
                    break;
                }

            case 40:
                {
                    if (selectedIndex + calCol() < totalitem) {
                        selectItem(selectedIndex + calCol());
                    }
                    wasProcesed = true;
                    break;
                }
            case 116: {
                loadDirectory('');
                wasProcesed = true;
                break;
            }
        }

        if (e.ctrlKey && e.keyCode == 70) {
            showSearch(e);
        }

        if (wasProcesed) {
            consumeEvent(e);
        }
    }
}

openDir = () => {
    var dir = dialog.showOpenDialog(mainWindow, {
        title: "Select the folder",
        properties: ['openDirectory']
    });
    if (dir) {
        currentDir = dir[0];
        loadDirectory('');
    }
};

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

dbclick = (e) => {
    if (['item-del', 'item-fav'].includes(e.target.classList[0])) return;

    var $item = $(e.target).closest('.items');

    var name = $item.data('name');
    if (name) {
        if ($item.data('isfile')) {
            processFile(name);
        } else {
            loadDirectory(name);
        }
        consumeEvent(e);
    }
}

/********************************************************************/

JumpFolder = (num) => {
    if (currentDir == "" || currentView !== 1) return;

    try {
        //get root dir
        var dir = path.dirname(currentDir);
        //list all folder in root dir
        var folders = WinDrive.ListFiles(dir).filter(f => {
            return f.isDirectory && !f.isHidden;
        }).map(a => a.FileName);
        //get current folder
        var toJump = folders.indexOf(path.basename(currentDir)) + num;
        //jump to next or previous folder
        if (toJump > -1 && toJump < folders.length) {
            currentDir = dir;
            loadDirectory(folders[toJump]);
        } else {
            //if no pre or next folder then jump to root
            currentDir = path.dirname(dir);
            dir = path.basename(dir);
            loadDirectory(dir);
        }

    } catch (error) {
        console.log(error);
    }
}

$('#tool-folderPrev').click(() => {
    JumpFolder(-1)
});
$('#tool-folderNext').click(() => {
    JumpFolder(1)
});

goToRoots = async () => {
    $('.title').text("Home");
    var diskIcon = './webcontent/image/hard-disk-256.png'
    $('#file-list').empty();
    var dir = currentDir;
    currentDir = '';

    folderId = null;
    await loadFavs();
    var drives = WinDrive.ListDrivesInfo().filter(d => d.Type !== 5);
    totalitem = drives.length;
    drives.sort().forEach((d, index) => {
        var ico = diskIcon;
        $('#file-list').append(CreateEl({
            FileName: d.Drive,
            isDirectory: true
        }, ico));
    });
    $filescount.empty().append('Files: ' + totalitem);
    calCol();
    var item = $('.items').toArray().filter((t) => {
        return $(t).attr('data-name') === dir
    });
    selectItem($('.items').index(item[0]));
    localStorage.setItem('currentDir', '');
    lazyLoad();
    toggleView(1);
}

$('#btn-home').click(goToRoots);

calCol = () => {
    if ($('#file-list').length !== 0) {
        var winW = window.innerWidth;
        var itemW = $('#file-list').children().get(0).offsetWidth + 10;
        var row = parseInt(winW / (itemW));
        return row;
    }
    return 0;
}

$(() => {

    $('#loadingDiv').on('click mousedown mouseup keyup keydown', consumeEvent);

    $(document).on('dragover', consumeEvent);

    $('.top input').on('change', (e) => {
        $('.top input').prop('checked', e.target.checked);
        mainWindow.setAlwaysOnTop(e.target.checked);
    });

    $(document).on('webkitfullscreenchange', () => {
        if (currentView === 1) {
            selectItem(selectedIndex);
        }
    });

    db.init().then(() => {
        db.File.count().then(c => {
            if (c == 0) {
                $loading.find('.fa-database').removeClass('d-none');
                createBackgroundWin('reload-Db', {
                    folders: config.scanFolder,
                    filters: compressFilter
                });
            }
        });


        if (localStorage.getItem('currentDir') !== null && localStorage.getItem('currentDir') !== "") {
            currentDir = localStorage.getItem('currentDir');
            loadDirectory('');
        } else {
            goToRoots();
        }
    });
});

$(document).on('keypress', jumpToFile);
$(document).on('drop', '#file-list', dropFile);
$('.openDir').on('click', openDir);
$('.tool-folderUp').on('click', returnFolder);
$fviewer.find('#file-list').on('click', '.items', itemClick);
$fviewer.find('#file-list').on('dblclick', dbclick);
$(document).on('keydown', keyboardHandler);


// var count = 0;

// testFiles = async () => {
//     var fis = WinDrive.ListFilesRO("D:\\Temp\\Hmangas");
//    await PopulateDB(f.dir, fis);
//    console.log("Done");
// }

// PopulateDB = async (folder, files) => {
//     var fis = files.filter((f) => {
//         return f.isDirectory || config.fileFilter.indexOf(f.extension.toLocaleLowerCase()) > -1
//     });
//     for (var f of fis) {
//         try {
//             if (!f.isDirectory) {
//                 count++;
//                 var file = await db.File.findAll({
//                     where: {
//                         Name: {[db.Op.like]: "%" + f.FileName.replace(/ \[digital\]| \[chinese\]| \[Decensored\]|.zip|.rar/ig, "") + "%"}
//                     }
//                 });

//                 if (file.length > 1) {
//                     fileFound = fileFound.concat(file);
//                 }
//             } else {
//                 await PopulateDB(f.FileName, f.Files);
//             }
//         } catch (error) {
//             console.log(error);
//         }
//     }
// }

// db.init().then(() => {

//     testFiles();
// });