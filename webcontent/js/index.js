var selectedIndex = 0;
var totalitem = 0;
var isMaximized = false;
var allFiles;
var contentScroll = $('.content').get(0);
var processRunning = 0;
var folderIcon = path.join('./webcontent/image/Folder.png');
var zipIcon = path.join('./webcontent/image/zip.png');
var videoIcon = path.join('./webcontent/image/video.png');

var $cmenu = $('#context-menu');
var favs = [];
var folderId = null;
var images = ['png', 'gif', 'jpg', 'jpeg', 'webp', 'bmp'];
var backgroundImage = [];
var compressingCount = 0;

ipcRenderer.on('thumb-create', (event, name) => {
    var item = $('.items:textequalto(' + name + ')').find('img')[0];
    if (item != undefined &&
        item.offsetTop < $(window).height() + $(item).closest('.items').height()) {

        var icon = './covers/' + name.replace('#', '%23') +
            (config.videoFilter.includes(name.split('.').pop()) ? '.png' : '.jpg');
        item.dataset.src = icon;
        item.src = icon;
    }
});

ipcRenderer.on('error', (event, msg) => {
    console.log(msg);

    if (String(msg).includes("Scan")) {
        $('#folder-reloading .fa-database').addClass('d-none');
    } else
        if (String(msg).includes("Thumbnail Create")) {
            --processRunning;
            if (processRunning == 0)
                $('#folder-reloading .fa-folder').addClass('d-none');
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

    if (path.dirname(result.dir) === basedir) {
        $('#file-list').append(CreateEl(result.file))
        sortElements();
    }
});

processFile = (name) => {
    db.File
        .findOne({ where: { Name: name }, include: { model: db.Folder } })
        .then((f) => {
            if (f == null) f = { Name: name, folder: { Name: basedir } };
            var ex = f.Name.split('.').pop().toLocaleLowerCase();
            console.log(ex)
            if (config.fileFilters.includes(ex)) {
                loadZip(f);
            } else if (config.videoFilter.includes(ex)) {
                initPlayer(f);
            }
        });
}

selectItem = (index) => {
    selectedIndex = index;
    var nextEl = $('.items').get(index);
    var tout = setTimeout(() => {
        if (nextEl != undefined) {
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
            nextEl.focus();
        }
        clearTimeout(tout);
    });
    return nextEl;
};


itemClick = (event) => {
    $cmenu.css({
        display: "none"
    });
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
                    addToFav($item, event);
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

addToFav = async ($item, event) => {

    var name = $item.data('name');
    var isFile = $item.data('isfile');

    if (isFile && config.favId == 1) return;
    var f;
    try {
        f = await db.Folder.findOrCreate({
            where: {
                Name: path.join(basedir, name)
            }
        });

        if (isFile) {
            // files can't be without parent folder;
            if (folderId == null)
                folderId = (await db.Folder.Create({ Name: basedir })).Id;

            f = await db.File.findOrCreate({
                where: {
                    Name: name
                }
            });
        }

        var $star = $('.items:textequalto(' + name + ')').find('.fa-star');
        if (!favs.includes(name)) {

            if (!isFile) {
                f[0].updateAttributes({
                    folderId: folderId,
                    favoritefileId: 1
                });
            } else {
                var file = WinDrive.ListFiles(path.join(basedir, name), true)[0];
                f[0].updateAttributes({
                    CurrentPage: 0,
                    Size: file.Size,
                    folderId: folderId,
                    favoritefileId: config.favId
                });
            }
            $star.removeClass('far').addClass('in-fav fas');
            $('#list-favs').append(createEntry(f[0], isFile));
            favs.push(name);
        } else {
            f[0].updateAttributes({
                favoritefileId: null
            });
            $('#list-favs').find('#file-' + f[0].Id).remove();
            $star.removeClass('in-fav fas').addClass('far');
            var i = favs.indexOf(name);
            favs.splice(i, 1);
        }
    } catch (err) {
        console.log(err);
    }
}

function CreateEl(file, diskIcon) {
    var isFile = !file.isDirectory;
    var img = diskIcon === undefined ? isFile ? zipIcon : folderIcon : diskIcon;
    var isImage = false;
    if (isFile) {
        var ex = file.extension.toLocaleLowerCase();
        if (images.includes(ex)) {
            isImage = true;
            img = path.join(basedir, file.FileName).replace('#', '%23');
        } else if (config.videoFilter.includes(ex)) {
            img = videoIcon;
        }
    }

    var fav = favs.find(f => f.Name === file.FileName);
    var isFav;
    var page = " ";
    if (fav != undefined) {
        isFav = fav.isFav ? "in-fav fas" : "far";
        if (isFile && fav.Page > 0) {
            page = `<span class="file-page ${fav.Page + 1 == fav.TotalPage ? "bg-primary" : "bg-danger"}" ` +
                `data-pages="${fav.Page + 1}/${fav.TotalPage}" ></span>`
        }
    } else {
        isFav = "far";
    }
    var div = document.createElement('div');
    div.innerHTML =
        `<div data-isfile="${isFile}" data-name="${file.FileName}" tabindex="0" data-size="${file.Size}" data-mdate="${file.LastModified}" data-ex="${file.extension}" class="items" >
                <div class="item-file popup-msg" >
                    <div class="item-btns">
                        <span class="item-del fas fa-trash"></span>
                        <span class="item-fav ${isFav} fa-star ${isImage ? "d-none" : ""}"></span>
                    </div>
                    <div class="item-cover"><span><img draggable="false" data-src="${img}" src=""/></span></div>
                    <div class="item-name">${file.FileName}</div>
                    ${page}
                </div>
            </div>`;
    return div.firstElementChild;
}

loadFavs = async () => {
    var fos = await db.Folder.findAll({ where: { folderId: folderId } });
    var fis = await db.File.findAll({ where: { folderId: folderId } });
    favs = fos.concat(fis).map(f => {
        var isFav = f.favoritefileId !== null;
        var Name = f.Name.length < 4 ? f.Name : path.basename(f.Name);
        return { Name, Page: f.CurrentPage, isFav, TotalPage: f.TotalPage }
    });
}

loadDirectory = async (folder, id) => {

    console.time('s');
    var dir = folder != '' ? path.join(basedir, folder) : basedir;
    var fol = await db.Folder.findOne({
        where: { $or: [{ Id: id }, { Name: dir }] }
    });

    if (fol != null) {
        folderId = fol.Id;
        dir = fol.Name;
    } else {
        folderId = null;
    }

    console.time('f');
    await loadFavs();
    console.timeEnd('f');
    try {
        if (fs.lstatSync(dir).isDirectory()) {
            basedir = dir;
            var files = [];
            var folders = [];
            WinDrive.ListFiles(dir).forEach((f) => {
                var name = f.FileName.toLocaleLowerCase();
                if (!f.isHidden) {
                    if (f.isDirectory && name.includes(boxFilter)) {
                        folders.push(f);
                    } else {
                        if (images.concat(config.fileFilters).concat(config.videoFilter).includes(f.extension)
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
            $('#title').text(dir);
            selectedIndex = 0;
            lazyLoad();
            setTimeout(() => {

                var tFiles = files.filter(f => {
                    var fv = path.resolve("./covers", f.FileName);
                    return config.fileFilters.concat(config.videoFilter).includes(f.extension) &&
                        !fs.existsSync(fv + ".jpg") && !fs.existsSync(fv + ".png") && backgroundImage.find(f2 => f2.FileName === f.FileName) == undefined
                });

                if (tFiles.length > 0) {
                    $('#folder-reloading .fa-folder').removeClass('d-none');
                    createBackgroundWin('create-cover', { basedir, files: tFiles });
                    backgroundImage = backgroundImage.concat(tFiles);
                    processRunning++;
                }

                localStorage.setItem('basedir', basedir);
                $filescount.text('Files: ' + totalitem);
                filesList = allFiles = files.map(a => a.FileName);
                selectItem(selectedIndex);
            });
        }

        console.timeEnd('s');
    } catch (error) {
        goToRoots();
        console.log(error)
    }
};


returnFolder = async () => {
    if (basedir.length === 0) return;
    var dir = path.parse(basedir).base
    basedir = path.parse(basedir).dir
    if (dir === '') {
        goToRoots();
    } else {
        await loadDirectory('');
    }
    var item = $('.items:textequalto(' + dir + ')');
    selectItem($('.items').index(item[0]));
}

jumpToFile = (event) => {
    if (!event.ctrlKey) {
        var char = String.fromCharCode(event.charCode);
        if (char.match(/^[0-9a-zA-Z|\[|(]+$/ig)) {
            var $firstEl = $('.items').filter(function () {
                return $(this).text().trim()[0].toLocaleUpperCase() === char.toLocaleUpperCase();
            });
            if ($firstEl[0] != undefined)
                selectItem($('.items').index($firstEl));
        }
    }
}

keyboardHandler = (event) => {
    var wasProcesed = false;
    switch (event.keyCode) {
        case 13:
            {
                if (event.ctrlKey) {
                    setfullscreen();
                } else {
                    var $el = $(document.activeElement);
                    var name = $el.data('name');

                    if ($el.data('isfile')) {
                        if (images.includes(name.split('.').pop())) {
                            loadImage(name);
                        } else
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
                if (event.ctrlKey) {
                    returnFolder();
                } else if (selectedIndex - calCol() >= 0) {
                    selectItem(selectedIndex - calCol());
                }
                wasProcesed = true;
                break;
            }
        case 39:
            {
                if (event.ctrlKey) {
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

    if (event.ctrlKey && event.keyCode == 70) {
        showSearch(event);
    }

    if (wasProcesed) {
        event.stopPropagation();
        event.preventDefault();
    }
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

consumeClick = (event) => {
    event.stopPropagation();
    event.cancelBubble = true;
}

dropFile = function (e) {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files.length > 0) {
        var f = e.dataTransfer.files[0];
        if (fs.lstatSync(f.path).isDirectory()) {
            toggleView("FileViewer");
            basedir = f.path;
            loadDirectory('');
        } else {
            basedir = path.dirname(f.path);
            filesList = WinDrive.ListFiles(basedir)
                .reduce((acc, file) => {
                    return !f.isDirectory ? acc.concat(file.FileName) : acc;
                }, []);

            loadZip(path.basename(f.path));
        }
    }
};

cancerDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
}

dbclick = (event) => {
    if (['item-del', 'item-fav'].includes(event.target.classList[0])) return;

    var $item = $(event.target).closest('.items');

    var name = $item.data('name');
    if (name) {
        if ($item.data('isfile')) {
            if (images.includes(name.split('.').pop())) {
                loadImage(name);
            } else
            processFile(name);
        } else {
            loadDirectory(name);
        }
        event.stopPropagation();
        event.preventDefault();
    }
}

mousemove = (me) => {
    if (!$viewer.hasClass('d-none') && document.webkitIsFullScreen) {
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
/********************************************************************/

$('#tool-folderPrev').click(() => {
    JumpFolder(-1)
});
$('#tool-folderNext').click(() => {
    JumpFolder(1)
});

$(readyFunc = (event) => {

    $(document).keypress(jumpToFile);
    $(document).on('mousemove', mousemove);
    document.ondrop = dropFile;
    $(document).on('dragover', cancerDragOver);
    $('#loadingDiv').on('click', consumeClick);
    $('.footer').on('mousedown', consumeClick);
    $('#loadingDiv').on('mousedown', consumeClick);
    $('#backtofilelist').on('click', backToFileBrowser)
    $('#prev-file').on('click', prevFile);
    $('#prev-img').on('click', prevImg);
    $('#next-img').on('click', nextImg);
    $('#next-file').on('click', nextFile);
    $('.openDir').on('click', openDir);
    $('.tool-folderUp').on('click', returnFolder);
    $('#file-viewer #file-list').on('click', '.items', itemClick);
    $('#file-viewer #file-list').on('dblclick', dbclick);
    $('.top input[type=checkbox]').on('change', (e) => {
        $('.top input[type=checkbox]').prop('checked', e.target.checked);
        mainWindow.setAlwaysOnTop(e.target.checked);
    });

    db.init().then(() => {
        db.File.count().then(c => {
            if (c == 0) {
                $('#folder-reloading .fa-database').removeClass('d-none');
                createBackgroundWin('reload-Db', {
                    folders: config.scanFolder,
                    filters: config.fileFilters
                });
            }
        });


        if (localStorage.getItem('basedir') !== null && localStorage.getItem('basedir') !== "") {
            basedir = localStorage.getItem('basedir');
            loadDirectory('');
        } else {
            goToRoots();
        }
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
});