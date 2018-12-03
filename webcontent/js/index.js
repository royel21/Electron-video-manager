var backgroundImageIndex = [];
var selectedIndex = 0;
var totalitem = 0;
var isMaximized = false;
var $modalSearch = $('#modal-search');
var allFiles;
var contentScroll = $('.content').get(0);

hideCorner = (state) => {
    if (state === false) {
        $('.main').removeClass('top-corner');
        $('.menubar').removeClass('top-corner');
        $('.btn-sys-close').removeClass('unCorner');
        $('.footer').removeClass('unCorner');
    } else {
        $('.main').addClass('top-corner');
        $('.menubar').addClass('top-corner');
        $('.footer').addClass('unCorner');
        $('.btn-sys-close').addClass('unCorner');
    }
    isMaximized = state;
}

mainWindow.on('maximize', (event, a) => {
    hideCorner(true);
});

mainWindow.on('unmaximize', (event, a) => {
    hideCorner(false);
});

setfullscreen = () => {
    if (!document.webkitIsFullScreen) {
        document.body.webkitRequestFullscreen();
        mainWindow.setResizable(false);
        $('#page-n').css({
            display: 'none'
        });
    } else {
        document.webkitCancelFullScreen();
        $('#page-n').css({
            display: 'inline-block'
        });
        mainWindow.setResizable(true);
    }
    if ($('#viewer').hasClass('hidden')) {
        selectItem(selectedIndex);
    }
}

ipcRenderer.on('thumb-create', (event, index) => {
    var $item = $('.items').eq(index);
    var item = $item.find('img')[0];
    if (item != undefined) {
        var name = 'covers/' + $item.data('name').replace('#', '%23') + '.jpg';
        item.dataset.src = name;
        if (item.offsetTop < $(window).height() + $item.height()) {
            item.src = name;
        }

        // if (item.offsetTop < contentScroll.scrollTop) {
        //     item.src = name;
        // }

        // var top = item.offsetTop + item.offsetHeight;
        // var sctop = contentScroll.scrollTop + contentScroll.offsetHeight-45;
        // if (top > sctop+2) {
        //     item.src = name;
        // }
    }
});

ipcRenderer.on('error', (event, msg) => {
    console.log(msg);

    if (String(msg).indexOf("Scan") > -1) {
        $('#folder-reloading .fa-database').addClass('d-none');
    } else
    if (String(msg).indexOf("Thumbnail Create") > -1) {
        $('#folder-reloading .fa-folder').addClass('d-none');
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

processFile = (name) => {
    switch (String(name).split('.').pop().toLocaleUpperCase()) {
        case "RAR":
        case "ZIP":
            {
                isImage = false;
                loadZip(path.join(basedir, name));
                break;
            }
        case "JPG":
        case "PNG":
        case "GIF":
            {
                isImage = true;
                loadImage(name);
                break;
            }
    }
}

selectItem = (index) => {
    var nextEl = $('.items').get(index);
    selectedIndex = index;
    $(nextEl).focus();
    centerItem(nextEl);
    return nextEl;
};

centerItem = async (nextEl) => {
    if (nextEl.offsetTop < contentScroll.scrollTop) {
        contentScroll.scroll({
            top: nextEl.offsetTop - 45,
            behavior: 'auto'
        });
    }

    var top = nextEl.offsetTop + nextEl.offsetHeight;
    var sctop = contentScroll.scrollTop + contentScroll.offsetHeight - 45;
    var dif = top - sctop;
    if (top > sctop + 2) {
        contentScroll.scroll({
            top: contentScroll.scrollTop + dif,
            behavior: 'auto'
        });
    }
}

itemClick = (event) => {
    var $item = $(event.target).closest('.items');

    if ($item.get(0) != undefined) {
        var index = $('.items').index($item);
        switch (event.target.classList[0]) {
            case 'item-del':
                {
                    deleteFile(path.join(basedir, $item.data('name')), true)
                    .then(resp => {
                        if (resp == 0) {
                            $item.fadeOut('slow', () => {
                                $item.remove();
                            });
                        }
                    });
                    break;
                }
            case 'item-fav':
                {
                    if (config.favId > -1) {
                        var name = $item.data('name');
                        db.VideoFile.findOne({
                            where: {
                                Name: name
                            }
                        }).then((f) => {

                            if (f.favoritevideoId != config.favId) {
                                f.updateAttributes({
                                    favoritevideoId: config.favId
                                });

                                $(event.target).removeClass('far').addClass('in-fav fas');
                                $('#list-favs').append(template('./template/list-row.html', {
                                    id: f.Id,
                                    name: f.Name,
                                    size: FormattBytes(f.Size)
                                }));

                            } else {
                                f.updateAttributes({
                                    favoritevideoId: null
                                });
                                $('#list-favs').find('#file-' + f.Id).remove();
                                $(event.target).removeClass('in-fav fas').addClass('far');
                            }

                        });
                    }
                    break;
                }
        }

        if (totalitem !== 0) {
            selectItem(index);
        }
        event.stopPropagation();
        event.preventDefault();
    }
}

function CreateEl(index, file, isFile, diskIcon) {
    var name = file.FileName;
    var filesize = FormattBytes(file.Size == undefined ? 0 : file.Size);
    var img = diskIcon === undefined ? isFile ? path.join('zip.png') : path.join('Folder.png') : diskIcon;

    if (isFile) {
        switch (file.extension) {
            case 'rar':
            case 'zip':
                {
                    var cover = path.join('./covers/' + name + '.jpg');
                    if (fs.existsSync(cover)) {
                        img = String(cover).replace('#', '%23');
                    } else {
                        img = path.join('zip.png');
                        backgroundImageIndex.push({
                            name,
                            index
                        });
                    }
                    break;
                }
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
                {
                    img = path.join(basedir, name);
                    break;
                }
        }
    }

    return template('./template/file.html', {
        name: name,
        isFile: isFile,
        filesize: filesize,
        icon: img,
        isFav: isFile ? "" : "d-none"
    });
}

loadDirectory = async (folder) => {
    var dir = folder ? path.join(basedir, folder) : basedir;
    try {
        if (fs.lstatSync(dir).isDirectory()) {
            basedir = dir;
            var files = [];
            var folders = [];
            var $div = $("<div>");
            backgroundImageIndex = [];

            $('#file-list').empty();

            WinDrive.ListFiles(dir).sort((a, b) => {
                var n1 = a.FileName.toLocaleUpperCase().replace(/[\{|\[]/g, "0");
                var n2 = b.FileName.toLocaleUpperCase().replace(/[\{|\[]/g, "0");
                return n1.localeCompare(n2);
            }).forEach((f) => {
                if (!f.isHidden) {
                    if (f.isDirectory) {
                        folders.push(f);
                    } else {
                        if (['png', 'gif', 'jpg'].concat(config.fileFilters).indexOf(f.extension) > -1)
                            files.push(f);
                    }
                }
            });

            totalitem = folders.length + files.length;
            folders.forEach((f, index) => {
                $div.append(CreateEl(index, f, false));
            });
            files.forEach((f, index) => {
                $div.append(CreateEl(folders.length + index, f, true));
            });
            $('#file-list').empty().append($div.children());

            if (backgroundImageIndex.length > 0) {
                $('#folder-reloading .fa-folder').removeClass('d-none');
                createBackgroundWin('create-cover', {
                    basedir,
                    files: backgroundImageIndex
                });
            }

            $('.content').css('height', window.innerHeight);
            localStorage.setItem('basedir', basedir);
            $filescount.text('Files: ' + totalitem);
            allFiles = files.map(a => path.join(basedir, a.FileName));
            filesList = allFiles;
            $('#title').text(dir);
            if (totalitem > 0) selectItem(0);
            lazyLoad();
            db.VideoFile.findAll({
                where: {
                    favoritevideoId: {
                        $ne: null
                    }
                }
            }).then(fis => {
                for (let f of fis) {
                    $('.items:contains(' + f.Name + ')')
                        .find('.item-fav')
                        .addClass('in-fav fas');
                }
            });
        }
    } catch (error) {
        goToRoots();
        console.log(error)
    }

    $itemsFound = [];
    curIndex = 0;
    $fileFound.text('0/0');
};

returnFolder = () => {
    if (basedir.length === 0) return;
    var dir = path.parse(basedir).base
    basedir = path.parse(basedir).dir
    if (dir === '') {
        goToRoots();
        return
    }

    loadDirectory('')
    var item = $('.items').toArray().filter((t) => {
        return $(t).data('name') === dir
    });

    selectItem($('.items').index(item[0]));
}

keyboardHandler = (event) => {

    var isViewerHidden = $('#viewer').hasClass('hidden');
    var wasProcesed = false;
    if (isViewerHidden && event.target.type !== 'number')
        switch (event.keyCode) {

            case 13:
                {
                    if (event.ctrlKey) {
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
                    if (event.ctrlKey) {
                        JumpFolder(-1);
                    } else
                    if (isViewerHidden) {
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
                    if (event.ctrlKey) {
                        returnFolder();
                    } else if (isViewerHidden && selectedIndex - calCol() >= 0) {
                        selectItem(selectedIndex - calCol());
                    }
                    wasProcesed = true;
                    break;
                }
            case 39:
                {
                    if (event.ctrlKey) {
                        JumpFolder(1);
                    } else
                    if (isViewerHidden) {
                        if (selectedIndex < totalitem - 1) {
                            selectItem(selectedIndex + 1);
                        } else {
                            selectItem(0);
                        }
                    }
                    wasProcesed = true;
                    break;
                }

            case 40:
                {
                    if (isViewerHidden && selectedIndex + calCol() < totalitem) {
                        selectItem(selectedIndex + calCol());
                    }
                    wasProcesed = true;
                    break;
                }
        }

    if (wasProcesed) {
        event.stopPropagation();
        event.preventDefault();
    }
}


goToRoots = () => {
    $('#title').text("Home");
    var diskIcon = 'hard-disk-256.png'
    $('#file-list').empty();
    var dir = basedir;
    basedir = '';
    var drives = WinDrive.ListDrivesInfo();
    totalitem = drives.length;
    drives.sort().forEach((d, index) => {
        var ico = diskIcon;
        $('#file-list').append(CreateEl(index, {
            FileName: d.Drive
        }, false, ico));
    });
    $filescount.empty().append('Files: ' + totalitem);
    calCol();
    var item = $('.items').toArray().filter((t) => {
        return $(t).attr('data-name') === dir
    });
    selectItem($('.items').index(item[0]));
    localStorage.setItem('basedir', '');
    lazyLoad();
}

openDir = () => {
    var dir = dialog.showOpenDialog(mainWindow, {
        title: "Select the folder",
        properties: ['openDirectory']
    });
    if (dir) {
        basedir = dir[0];
        loadDirectory('');
    }
};


showSearch = (e) => {
    var $search = $(e.target);
    var $toolbar = $search.closest('div');

    $toolbar.append($modalSearch);

    $modalSearch.css({
        bottom: $toolbar.height() + 15
    });
    $modalSearch.css({
        display: 'block'
    });
    $modalSearch.find('input[type=text]').focus();
}

var curIndex = 0;
var $itemsFound = [];
var $fileFound = $('#file-found');
searchFile = (e) => {
    if (e.target.id === "btn-search" || e.keyCode === 13) {
        var search = $('#search').val();
        if (search.length > 2) {
            $itemsFound = $('.items:contains(' + search + ')');
            var index = $('.items').index($itemsFound[0]);
            selectItem(index);
            curIndex = 0;
            $fileFound.text((curIndex + 1) + '/' + $itemsFound.length);
        } else {
            $itemsFound = [];
            curIndex = 0;
        }
    }
    consumeClick(e);
}


nextSearchedFile = (e) => {
    if ($itemsFound.length === 0) {
        consumeClick(e);
        return;
    }
    if (curIndex < $itemsFound.length - 1) {
        var index = $('.items').index($itemsFound[++curIndex]);
        selectItem(index);
    } else {
        curIndex = 0;
        var index = $('.items').index($itemsFound[0]);
        selectItem(index);
    }
    $fileFound.text((curIndex + 1) + '/' + $itemsFound.length);
    consumeClick(e);
}
prevSearchedFile = (e) => {
    if ($itemsFound.length === 0) {
        consumeClick(e);
        return;
    }
    if (curIndex > 0) {
        var index = $('.items').index($itemsFound[--curIndex]);
        selectItem(index);
    } else {
        curIndex = $itemsFound.length - 1;
        var index = $('.items').index($itemsFound[curIndex]);
        selectItem(index);
    }
    $fileFound.text((curIndex + 1) + '/' + $itemsFound.length);
    consumeClick(e);
}
closeSearch = (e) => {
    $modalSearch.css({
        display: 'none'
    });
    consumeClick(e);
}


var offset = {
    x: 0,
    y: 0
};
var isPressed = false;

consumeClick = (event) => {
    event.stopPropagation();
    event.cancelBubble = true;
}

closeWindow = () => mainWindow.close();
minWindow = () => mainWindow.minimize();
maxWindow = () => {
    if (isMaximized === true) {
        mainWindow.unmaximize();
        hideCorner(false);
    } else {
        mainWindow.maximize();
        hideCorner(true);
    }
}

dbclick = (event) => {
    var $item = $(event.target).closest('.items');

    var name = $item.attr('data-name');
    if (name) {
        if ($item.data('isfile')) {
            processFile(name);
        } else {
            loadDirectory(name);
        }
        event.stopPropagation();
        event.preventDefault();
    }
}

mousemove = (me) => {
    if (!$('#viewer').hasClass('hidden') && document.webkitIsFullScreen) {
        if (me.clientY < (window.innerHeight - 100)) {
            $('.toolbar').addClass('slide-down');
            $('output').css({
                display: 'none'
            });
        } else {
            $('.toolbar').removeClass('slide-down');
            $('output').css({
                display: 'inline-block'
            });
            rangePopup();
        }
    }
}

dropFile = function (e) {
    e.preventDefault();
    e.stopPropagation();

    var f = e.dataTransfer.files[0];

    if (fs.lstatSync(f.path).isDirectory()) {
        toggleViewer(false);
        basedir = f.path;
        loadDirectory('');
    } else {
        basedir = path.dirname(f.path);
        filesList = WinDrive.ListFiles(basedir).filter(f => {
            return !f.isDirectory
        }).map(a => a.FileName);
        loadZip(f.path);
    }
};

cancerDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
}

/********************************************************************/

$('#tool-folderPrev').click(() => {
    JumpFolder(-1)
});
$('#tool-folderNext').click(() => {
    JumpFolder(1)
});

$(readyFunc = (event) => {
    $(document).on('keydown', keyboardHandler);
    $(document).on('mousemove', mousemove);
    document.ondrop = dropFile;
    $(document).on('dragover', cancerDragOver);
    $('#btn-sys-min').on('click', minWindow);
    $('#btn-sys-max').on('click', maxWindow);
    $('.btn-sys-close').on('click', closeWindow);
    $('#loadingDiv').on('click', consumeClick);
    $('.footer').on('mousedown', consumeClick);
    $('#loadingDiv').on('mousedown', consumeClick);
    $('#backtofilelist').on('click', backToFileBrowser)
    $('#prev-file').on('click', prevFile);
    $('#next-file').on('click', nextFile);
    $('.btn-fullscr').on('click', setfullscreen);
    $('.openDir').on('click', openDir);
    $('.tool-folderUp').on('click', returnFolder);
    $('.open-search').on('click', showSearch);
    $('#file-list').on('click', itemClick);
    $('#file-list').on('dblclick', dbclick);
    $('#next-item-found').click(nextSearchedFile);
    $('#prev-item-found').click(prevSearchedFile);
    $('#search').keydown(searchFile);
    $('#close-search').click(closeSearch);

    $('.top input[type=checkbox]').on('change', (e) => {
        $('.top input[type=checkbox]').prop('checked', e.target.checked);
        mainWindow.setAlwaysOnTop(e.target.checked);
    });

    if (localStorage.getItem('basedir') !== null && localStorage.getItem('basedir') !== "") {
        basedir = localStorage.getItem('basedir');
        loadDirectory('');
    } else {
        goToRoots();
    }

    db.init().then(() => {
        db.VideoFile.count().then(c => {
            if (c == 0) {
                $('#folder-reloading .fa-database').removeClass('d-none');
                createBackgroundWin('reload-Db', {
                    folders: config.scanFolder,
                    filters: config.fileFilters
                });
            }
        });
    });
    // var count = 0;

    // testFiles = async () => {
    //     var fis = WinDrive.ListFilesRO("D:\\Temp\\Hmangas");
    //    await PopulateDB(f.dir, fis);
    //    console.log("Done");
    // }

    // PopulateDB = async (folder, files) => {
    //     var fis = files.filter((f) => {
    //         return f.isDirectory || config.fileFilters.indexOf(f.extension.toLocaleLowerCase()) > -1
    //     });
    //     for (var f of fis) {
    //         try {
    //             if (!f.isDirectory) {
    //                 count++;
    //                 var file = await db.VideoFile.findAll({
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
});