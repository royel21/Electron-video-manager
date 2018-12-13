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
var totalimg = [];
var fileN = 0;
var LoadNextImage = true;
var loadingNext = false;
var $viewer = $('#image-viewer');
var $input;
var imageSlider = null;
var imgPrev = $('<img>')[0];
var currentFile;

/***********************************************************/
function imgFilter(entry) {
    return imagesFilter.includes(String(entry.name).toLocaleLowerCase().split('.').pop());
}
/***********************************************************/
function getRandomNum() {
    return Math.random() * (1 - 99999) + 1;
}
/**********************************************************/
function imageViewerCleanUp() {
    if (currentView === 2) {
        $(document).off('keydown', ViewerKeyUp);
        $('#prev-file').off('click', prevFile);
        $('#prev-img').off('click', prevImg);
        $('#next-img').off('click', nextImg);
        $('#next-file').off('click', nextFile);
        $('#backtofilelist').off('click', backToFileBrowser);
    }
}

/***********************************************************/
prevImg = () => {
    if (!loadingNext) {
        if (currentFile.Current > 0) {
            direction = false;
            $(tempImg).stop();
            if (LoadNextImage) {
                showImage(--currentFile.Current);
            }
        } else {
            prevFile();
        }
    }
}
/***********************************************************/
nextImg = () => {
    if (!loadingNext) {
        if (currentFile.Current < totalPage - 1) {
            direction = true;
            $(tempImg).stop();
            if (LoadNextImage) {
                showImage(++currentFile.Current);
            }
        } else {
            nextFile();
        }
    }
}
/***********************************************************/
prevFile = () => {
    if (fileN > 0 && isImage === false) {
        processFile(filesList[--fileN].Name);
    } else {
        backToFileBrowser();
    }
}
/***********************************************************/
nextFile = () => {
    if (fileN < filesList.length - 1 && isImage === false) {
        processFile(filesList[++fileN].Name);
    } else {
        backToFileBrowser();
    }
}
/***********************************************************/
$('#page-n').on('click', function () {

    if (totalPage !== 0 && $input == undefined) {
        this.textContent = "";
        $input = $(`<input type="number" value=${(currentFile.Current + 1)}
                         style="width:70px; padding:0" min=1 
                         max=${totalPage}>`).appendTo($(this)).focus();

        $input.on('keyup', (event) => {
            if (event.keyCode === 13) {
                currentFile.Current = parseInt($input.val()) - 1;

                if (currentFile.Current > totalPage - 1) {
                    currentFile.Current = totalPage - 1;
                }
                imageSlider.value = currentFile.Current;
                viewImage(currentFile.Current);
                LoadNextImage = true;
            }
            event.stopPropagation();
        });
        $input.focusout(() => {
            $input = undefined;
            $('.pages').text(String(currentFile.Current + 1).padStart(totalPage > 99 ? 3 : 2, '0') + "/" + totalPage);
        })
        $input.keydown((e) => {
            e.stopPropagation()
        });
        $input.keypress((e) => {
            e.stopPropagation()
        });
    }
});

viewImage = (pn) => {
    viewerImg.src = getImage(pn);
    $filescount.text('Files: ' + (fileN + 1) + '/' + filesList.length);
    $('.pages').text(String(currentFile.Current + 1).padStart(totalPage > 99 ? 3 : 2, '0') + "/" + totalPage);
}
/***********************************************************/
setUpRange = () => {
    if (imageSlider == null) {
        imageSlider = new SliderRange('#image-seek');

        imageSlider.oninput = (val) => {
            currentFile.Current = Math.round(val);
            viewImage(currentFile.Current);
            LoadNextImage = true;
        }
        imageSlider.onPreview = (val) => {
            var v = Math.round(val);
            imgPrev.src = getImage(v);
            imageSlider.setPreviewTitle(v + 1);
        }
        imageSlider.setPreviewContent(imgPrev);
    }
    imageSlider.min = 0;
    imageSlider.max = totalPage - 1;
    imageSlider.value = currentFile.Current;
}

function loadZip(file) {
    loadingNext = true;
    isImage = false;
    updateItemProgress(currentFile);
    $('#loadingDiv').removeClass('d-none');
    currentFile = {
        Id: file.Id,
        Name: file.Name,
        dir: file.folder.Name,
        Current: file.Current == undefined ? 0 : file.Current,
        Total: 0
    };

    compressFile().then(result => {
        if (result) {
            if (file.Current == undefined) {
                var tempFile = WinDrive.ListFiles(currentFile.dir, [], true)[0];
                tempFile.Total = totalPage;
                tempFile.DirName = currentDir;
                db.File.findOrCreateNew(tempFile).then(f => {
                    loadingNext = false;
                });
            }
            updateRecents();
            loadingNext = false;
        }
    });
}

compressFile = async () => {
    var filePath = path.join(currentFile.dir, currentFile.Name);

    if (fs.existsSync(filePath)) {
        totalimg = [];
        if (filePath.includes('.rar')) {
            if (rar != null) rar = null;
            rar = new rcunrar(filePath);
            totalimg = rar.ListFiles().filter(e => {
                return imagesFilter.includes(e.Extension.toLocaleLowerCase());
            }).sort((a, b) => {
                return a.Name.localeCompare(b.Name);
            });
        } else {
            if (zip !== null) {
                zip.close();
                zip = null;
            }
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

            currentFile.Total = totalPage = totalimg.length;
            $('#loadingDiv').addClass('d-none');
            $('.title').text(currentFile.Name);

            setUpRange();
            viewImage(currentFile.Current);
            imgViewerInit();
            currentDir = currentFile.dir;
            toggleView(2);
            reloadList(compressFilter);
            fileN = filesList.findIndex(f => f.Name === currentFile.Name);
            LoadNextImage = true;
            return true;
        }
    }
    $('#loadingDiv').addClass('d-none');
    backToFileBrowser();
    return false;
}

/*******************Compress File**************************************/
/***********************************************************/
function loadImage(fname) {
    isImage = true;
    viewerImg.src = path.join(currentDir, fname) + '?x=' + getRandomNum();
    $('.title').text(path.join(currentDir, fname));
    currentFile.Current = fileN = filesList.indexOf(fname);
    totalPage = filesList.length;
    toggleView(2);
}

/***********************************************************/
function showImage(pn) {
    LoadNextImage = false;
    if (isImage === false) {
        tempImg.src = getImage(pn);
    } else {
        fileN = pn;
        tempImg.src = path.join(currentDir, filesList[pn].Name) + '?x=' + getRandomNum();
        $('.title').text(path.join(currentDir, filesList[pn].Name));
    }

    $filescount.text('Files: ' + (fileN + 1) + '/' + filesList.length);
    $('.pages').text(String(currentFile.Current + 1).padStart(totalPage > 99 ? 3 : 2, '0') + "/" + totalPage);
}

getImage = function (pn) {
    let entry = totalimg[pn];
    if (entry == undefined) return;

    var img = 'data:image/jpeg;base64,' +
        (zip != undefined ? zip.entryDataSync(entry.name) :
            rar.ExtractFile(entry)).toString('base64');
    return img
}

/******************************************************/
$viewer.mousedown(event => {
    event.which === 1 ? nextImg() : prevImg();
    $viewer.focus();
});

/******************************************************/

async function backToFileBrowser() {
    imageViewerCleanUp();
    if (WinDrive.ListFiles(currentDir).length === totalitem) {
        filesList = allFiles;
        $filescount.text('Files: ' + totalitem);
        $('.title').text(currentDir);
    } else {
        await loadDirectory('');
    }
    selectItem(updateItemProgress(currentFile));
    toggleView(1);

    currentFile = undefined;
    imageSlider = null;
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
    if (currentView !== 2) {
        $('#prev-file').on('click', prevFile);
        $('#prev-img').on('click', prevImg);
        $('#next-img').on('click', nextImg);
        $('#next-file').on('click', nextFile);
        $('#backtofilelist').on('click', backToFileBrowser);
        $(document).on('keydown', ViewerKeyUp);
    }
}