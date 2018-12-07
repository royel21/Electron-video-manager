const StreamZip = require('node-stream-zip');
const rcunrar = require('rcunrar');

var zip = null;
var rar = null;
var direction = true;
var totalPage = 0;
var isImage = false;
const viewerImg = document.getElementById('myimg');
const tempImg = document.getElementById('temp-img');
const $filescount = $('.total-files');
const $imgRange = $('#img-seek');
/***********************************************************/
var pageNum = 0;
var totalimg = [];
var filename;
var fileN = 0;
var backImages = [];
var isChange = true;
var LoadNextImage = true;
var loadingNext = false;
var $viewer = $('#image-viewer');
var $input;
var backgroundLoader;
var imageSlider = null;
var imgPrev = $('<img>')[0];
updateFilePage = (file, page, totalPage) => {
    if (file != undefined && !isImage) {
        return db.db.query(`UPDATE files set Current = ${page}, Total = ${totalPage} WHERE Id = ${file.Id};`);
    }
}

/***********************************************************/
function imgFilter(entry) {
    return imagesFilter.includes(String(entry.name).toLocaleLowerCase().split('.').pop());
}
/***********************************************************/
function getRandomNum() {
    return Math.random() * (1 - 99999) + 1;
}
/**********************************************************/
function cleanUpViewer() {
    if (zip !== null) {
        zip.close();
        zip = null;
    }

    if (backgroundLoader != undefined) {
        clearInterval(backgroundLoader);
        backgroundLoader = undefined;
    }

    if (rar != null) rar = null;
    backImages = [];
    totalimg = [];

    $(document).off('keydown', ViewerKeyUp);
    $('#prev-file').off('click', prevFile);
    $('#prev-img').off('click', prevImg);
    $('#next-img').off('click', nextImg);
    $('#next-file').off('click', nextFile);
    $('#backtofilelist').off('click', backToFileBrowser);
}

$(window).on('beforeunload', (e) => {
    updateFilePage(filename, pageNum, totalPage).then(() => {
    });
});

/***********************************************************/
prevImg = () => {
    if (!loadingNext) {
        if (pageNum > 0) {
            direction = false;
            $(tempImg).stop();
            if (LoadNextImage) {
                showImage(--pageNum);
            }
        } else {
            prevFile();
        }
    }
}
/***********************************************************/
nextImg = () => {
    if (!loadingNext) {
        if (pageNum < totalPage - 1) {
            direction = true;
            $(tempImg).stop();
            if (LoadNextImage) {
                showImage(++pageNum);
            }
        } else {
            nextFile();
        }
    }
}
/***********************************************************/
prevFile = () => {
    if (fileN > 0 && isImage === false) {
        processFile(filesList[--fileN]);
    } else {
        backToFileBrowser();
    }
}
/***********************************************************/
nextFile = () => {
    if (fileN < filesList.length - 1 && isImage === false) {
        processFile(filesList[++fileN]);
    } else {
        backToFileBrowser();
    }
}
/***********************************************************/
$('#page-n').on('click', function () {

    if (totalPage !== 0 && $input == undefined) {
        this.textContent = "";
        $input = $(`<input type="number" value=${(pageNum + 1)}
                         style="width:70px; padding:0" min=1 
                         max=${totalPage}>`).appendTo($(this)).focus();

        $input.on('keyup', (event) => {
            if (event.keyCode === 13) {
                pageNum = parseInt($input.val()) - 1;

                if (pageNum > totalPage - 1) {
                    pageNum = totalPage - 1;
                }
                isChange = false;
                $imgRange.val(pageNum + 1);
                viewImage(pageNum);
                isChange = true;
                LoadNextImage = true;
            }
            event.stopPropagation();
        });
        $input.focusout(() => {
            $input = undefined;
            $('.pages').text(String(pageNum + 1).padStart(totalPage > 99 ? 3 : 2, '0') + "/" + totalPage);
        })
        $input.keydown((e) => {
            e.stopPropagation()
        });
        $input.keypress((e) => {
            e.stopPropagation()
        });
    }
});

$imgRange.on('input', (event) => {

    if (isChange) {
        pageNum = event.target.value - 1;
        if (pageNum > totalPage - 1) {
            pageNum = totalPage - 1;
        }
        viewImage(pageNum);
        //rangePopup();
        LoadNextImage = true;
    }
});

rangePopup = () => {
    if ($('#seeker')[0].style.display != 'none') {
        var newPoint, newPlace;
        // Cache this for efficiency

        // Measure width of range input
        width = $('#seeker').width();

        // Figure out placement percentage between left and right of input
        newPoint = ($imgRange.val() - 1) / (totalPage - 1);

        newPlace = (width * newPoint.toFixed(3));

        $imgRange.next("output")
            .css({
                left: newPlace,
                marginLeft: newPoint.map(0.0, 1.0, -9, -33)
            }).text($imgRange.val());
    }

    $filescount.text('Files: ' + (fileN + 1) + '/' + filesList.length);
    $('.pages').text(String(pageNum + 1).padStart(totalPage > 99 ? 3 : 2, '0') + "/" + totalPage);
}

viewImage = (pn) => {
    viewerImg.src = getImage(pn);
}
/***********************************************************/
setUpRange = () => {
    imageSlider = new SliderRange('#image-seek');
    imageSlider.min = 0;
    imageSlider.max = totalPage - 1;
    imageSlider.value = pageNum;
    imageSlider.oninput = (val) => {
        pageNum = Math.round(val);
        console.log(pageNum);
        viewImage(pageNum);
        LoadNextImage = true;
    }
    imageSlider.setPreviewContent(imgPrev);
    imageSlider.onPreview = (val) =>{
        var v = Math.round(val);
        console.log(Math.round(v));
        imgPrev.src = getImage(v);
        imageSlider.setPreviewTitle(v+1);
    }
}

function loadZip(file) {
    loadingNext = true;
    isImage = false;
    cleanUpViewer();
    $('#loadingDiv').removeClass('d-none');
    updateFilePage(filename, pageNum, totalPage);

    filename = {
        path: path.join(currentDir, file.Name),
        pn: 0
    }

    if (file.Current != undefined) {
        var dir = path.join(file.folder.Name, file.Name);
        if (fs.existsSync(dir)) filename.path = dir;
        filename.Id = file.Id;
        filename.pn = file.Current;
    }

    compressFile(filename.path, filename.pn).then(result => {
        if (result) {
            if (file.Current == undefined) {
                var tempFile = WinDrive.ListFiles(filename.path, [], true)[0];
                db.Folder.findOrCreate({
                    where: {
                        Name: currentDir
                    }
                }).then(folder => {
                    db.File.create({
                        Name: file.Name,
                        folderId: folder[0].Id,
                        Current: 0,
                        Total: totalPage,
                        Size: tempFile.Size
                    }).then(f => {
                        updateRecents(f);
                        loadingNext = false;
                        filename.Id = f.Id;
                    });
                });
            } else {
                updateRecents(file);
                loadingNext = false;
            }
        }
    });
}

updateRecents = async (file) => {

    if (config.recents.find(f => {
        return f.Id == file.Id;
    }) == undefined) {
        config.recents.unshift({
            Id: file.Id,
            Name: file.Name
        });
    } else {
        var lastFile = config.recents.removeById({
            Id: file.Id
        });
        config.recents.unshift(lastFile);
    }

    if (config.recents.length > config.recentMax) config.recents.pop();

    if (!$('#recent').hasClass('d-none')) {

        var li = $('#list-recent #file-' + file.Id)[0];
        if (li == undefined) {
            $('#list-recent').prepend(createEntry(file), true);
        } else {
            $(li).prependTo($('#list-recent'));
        }
        $('#recent-count').text(config.recents.length + "/" + config.recentMax);
    }
};
/*******************Compress File**************************************/
compressFile = async (filePath, pn) => {

    if (fs.existsSync(filePath)) {

        if (filePath.includes('.rar')) {
            rar = new rcunrar(filePath);
            totalimg = rar.ListFiles().filter(e => {
                return imagesFilter.includes(e.Extension.toLocaleLowerCase());
            }).sort((a, b) => {
                return a.Name.localeCompare(b.Name);
            });
        } else {
            zip = new StreamZip({
                file: filePath,
                storeEntries: true
            });
            await new Promise((resolve, reject) => {
                zip.on('ready', () => {
                    totalimg = Object.values(zip.entries()).sort((a, b) => {
                        return String(a.name).localeCompare(String(b.name));
                    }).filter(imgFilter);
                    resolve();
                });
            });
        }

        if (totalimg.length > 0) {
            var p = path.basename(filePath);
            totalPage = totalimg.length;
            viewerImg.src = getImage(pn);
            pageNum = pn;
            $('#loadingDiv').addClass('d-none');
            $('.title').text(p);
            fileN = filesList.indexOf(p);

            $imgRange.attr('max', totalPage);
            $imgRange.val(pageNum + 1);
            setUpRange();
            imgViewerInit();
            toggleView(2);
            LoadNextImage = true;
            return true;
        }
    }

    $('#loadingDiv').addClass('d-none');
    backToFileBrowser();
    return false;
}
/***********************************************************/
function loadImage(fname) {
    filename = {
        path: path.join(currentDir, fname)
    };
    isImage = true;
    viewerImg.src = path.join(currentDir, fname) + '?x=' + getRandomNum();
    $('.title').text(path.join(currentDir, fname));
    pageNum = fileN = filesList.indexOf(fname);
    totalPage = filesList.length;
    $imgRange.attr('max', totalPage);
    $imgRange.val(1);
    imgViewerInit();
    toggleView(2);
}

/***********************************************************/
function showImage(pn) {
    console.time('i')
    isChange = false;
    LoadNextImage = false;
    if (isImage === false) {
        tempImg.src = getImage(pn);
    } else {
        fileN = pn;
        tempImg.src = path.join(currentDir, filesList[pn]) + '?x=' + getRandomNum();
        $('.title').text(path.join(currentDir, filesList[pn]));
    }
}

getImage = function (pn) {
    let entry = totalimg[pn];
    if (entry == undefined) return;

    var img = 'data:image/jpeg;base64,' +
        (zip != undefined ? zip.entryDataSync(entry.name) :
            rar.ExtractFile(entry)).toString('base64');
    return img
}


/***********************************************************/

$('#openFile').on('click', function () {

    dialog.showOpenDialog(mainWindow, {
        title: "Select the file to open",
        filters: [{
            name: 'Files',
            extensions: Filter
        },
        {
            name: 'All Files',
            extensions: ['*']
        }
        ]
    }, function (openedFile) {
        if (openedFile !== undefined && openedFile.length > 0) {
            currentDir = path.dirname(openedFile[0]);
            loadZip({ Name: openedFile[0] });
        }
    });
});

/******************************************************/
$viewer.mousedown(event => {
    event.which === 1 ? nextImg() : prevImg();
    $viewer.focus();
});

/******************************************************/
updateItemPageView = () => {
    var $item, index;
    if (filename.path != undefined) {
        $item = $('.items:textequalto(' + path.basename(filename.path) + ')');
        if (pageNum > 0 && !isImage) {
            var $itemf = $item.find('.item-file');
            $itemf.find('.file-page').remove();
            $itemf.append(`<span class="file-page ${pageNum + 1 == totalPage ? "bg-primary" : "bg-danger"}"` +
                ` data-pages="${pageNum + 1}/${totalPage}"></span>`);
            index = $('.items').index($item[0])
        } else {
            index = fileN;
        }
    }
    toggleView(1);
    selectItem(index);
}
function backToFileBrowser() {
    cleanUpViewer();
    updateFilePage(filename, pageNum, totalPage);
    if (WinDrive.ListFiles(currentDir).length === totalitem) {
        filesList = allFiles;
        $filescount.text('Files: ' + totalitem);
        $('.title').text(currentDir);
        updateItemPageView();
    } else {
        loadDirectory('').then(() => {
            updateItemPageView();
        });
    }
}

/****Viewer Config****/
ViewerKeyUp = (event) => {

    switch (event.keyCode) {
        case 13:
            {
                setfullscreen();
                break;
            }
        case 37:
            {
                if (event.ctrlKey) {
                    prevFile();
                } else {
                    prevImg();
                }
                break;
            }
        case 38:
            {
                if (event.ctrlKey) {
                    backToFileBrowser();
                    break;
                }
                break;
            }
        case 39:
            {
                if (event.ctrlKey) {
                    nextFile();
                } else {
                    nextImg();
                }
                break;
            }
    }
}

tempImg.onload = function () {
    pgAnimation[config.pageAnimation]();
}

$('#img-content img').css("transform", "scaleX(" + config.imgScale + ")");

imgViewerInit = () => {
    $('#prev-file').on('click', prevFile);
    $('#prev-img').on('click', prevImg);
    $('#next-img').on('click', nextImg);
    $('#next-file').on('click', nextFile);
    $('#backtofilelist').on('click', backToFileBrowser);
    //$(window).on('resize', rangePopup);
    $(document).on('keydown', ViewerKeyUp);
    // rangePopup();
}