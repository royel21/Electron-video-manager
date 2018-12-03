

var direction = 'right';
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
var loadingImage = false
/***********************************************************/
function imgFilter(entry) {
    return ['png', 'gif', 'jpg', 'jpeg', 'bmp'].indexOf(String(entry.name).toLocaleLowerCase().split('.').pop()) > -1;
}
/***********************************************************/
function getRandomNum() {
    return Math.random() * (1 - 99999) + 1;
}
/**********************************************************/
function cleanUpViewer() {
    
}
$(window).on('beforeunload', () => {
    updateFilePage(filename, pageNum);
});

function resizeImage() {

    if ($('#viewer')[0].style.display !== 'none') {
        var ratio = viewerImg.width / viewerImg.height;
        if (isNaN(ratio)) return;

        $('#myimg').css('width', window.innerWidth);
        if ($('#viewer')[0].style.display !== 'none') {
            if (document.webkitIsFullScreen) {
                $('#myimg').css('height', window.innerHeight);
            } else {
                $('#myimg').css('height', window.innerHeight - 86);
            }
        }
        $(viewerImg).css("transform", "scaleX(" + config.imgScale + ")");
        rangePopup();
        $('#myimg').focus();
    }
}
/***********************************************************/
prevFile = () => {
    if (fileN > 0 && isImage === false) {
        LoadVideo(filesList[--fileN]);
    } else {
        backToFileBrowser();
    }
}
/***********************************************************/
nextFile = () => {
    if (fileN < filesList.length - 1 && isImage === false) {
        LoadVideo(filesList[++fileN]);
    } else {
        backToFileBrowser();
    }
}
/***********************************************************/
$('#page-n').on('click', function () {

    if (totalPage !== 0) {
        this.textContent = "";
        var $input = $(`<input type="number" value=${(pageNum + 1)}
                         style="width:70px; padding:0" min=1 
                         max=${totalPage}>`)
            .appendTo($(this)).focus();

        $input.click((event) => {
            event.stopPropagation();
        });

        $input.on('keyup', (event) => {
            if (event.keyCode === 13) {
                pageNum = parseInt($input.val()) - 1;

                if (pageNum > totalPage - 1) {
                    pageNum = totalPage - 1;
                }
                event.stopPropagation();
                event.preventDefault();
                isChange = false;
                $imgRange.val(pageNum + 1);
                $input = null;
                isChange = true;
            }
        });
        $input.focus();
    }
});

$imgRange[0].oninput = (event) => {

    if (isChange) {
        pageNum = event.target.value - 1;

        if (pageNum > totalPage - 1) {
            pageNum = totalPage - 1;
        }
        
        event.stopPropagation();
        event.preventDefault();
        rangePopup();
    }
};
rangePopup = (curPage, curFile) => {
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
    if (curPage != undefined) {
        $filescount.text('Files: ' + (curFile + 1) + '/' + filesList.length);
        $('.pages').text(String(curPage).padStart(totalPage > 99 ? 3 : 2, '0') + "/" + totalPage);
    }
}

/***********************************************************/

function LoadVideo(name, id) {
    timer = new Date();
    isImage = false;
    cleanUpViewer();
    $('#loadingDiv').removeClass('d-none');

    updateFilePage(filename, pageNum);

    // db.VideoFile.findOne({
    //     where: {
    //         $or: [{
    //             Id: id
    //         }, {
    //             Name: path.basename(name)
    //         }]
    //     },
    //     include: {
    //         model: db.Folder
    //     }
    // }).then((file) => {

    //     if (file != null) {

    //         filename = path.join(file.folder.Name, file.Name);
    //         if (fs.existsSync(filename)) {
    //             if (file.Name.indexOf('.rar') > -1) {
    //                 rar = new rcunrar(filename);
    //                 totalimg = rar.ListFiles().filter(e => {
    //                     return ['png', 'jpg', 'jpeg', 'gif'].indexOf(e.Extension.toLocaleLowerCase()) > -1;
    //                 }).sort((a, b) => {
    //                     return a.Name.localeCompare(b.Name);
    //                 });

    //                 totalPage = totalimg.length;

    //                 if (totalimg.length === 0) {
    //                     filename == undefined;
    //                     $('#loadingDiv').addClass('d-none');
    //                     return;
    //                 }

    //                 viewerImg.src = loadBackImage(file.CurrentPage);
    //                 setupView(file);
    //                 console.log(new Date()-timer);
    //             } else {

    //                 zip = new StreamZip({
    //                     file: filename,
    //                     storeEntries: true
    //                 });

    //                 zip.on('ready', () => {

    //                     totalimg = Object.values(zip.entries()).sort((a, b) => {
    //                         return String(a.name).localeCompare(String(b.name));
    //                     }).filter(imgFilter);

    //                     totalPage = totalimg.length;

    //                     if (totalimg.length === 0) {
    //                         filename == undefined;
    //                         $('#loadingDiv').addClass('d-none');
    //                         return;
    //                     }
    //                     viewerImg.src = loadBackImage(file.CurrentPage);
    //                     setupView(file);
    //                     console.log(new Date()-timer);
    //                 });
    //             }
    //         } else {
    //             $('#loadingDiv').addClass('d-none');
    //             backToFileBrowser();
    //         }
    //     }else{
    //         $('#loadingDiv').addClass('d-none');
    //         backToFileBrowser();
    //     }
    // });
}
setupView = async (file) => {
    pageNum = file.CurrentPage;
    $('.clock').addClass('clock-50up');
    $('#loadingDiv').addClass('d-none');
    toggleViewer(true);

    $('#title').text(file.Name);
    fileN = filesList.indexOf(filename);
    $imgRange.attr('max', totalPage);
    $imgRange.val(pageNum + 1);
    rangePopup(pageNum + 1, fileN + 1);

    if (config.recents.find(f => {
            return f.Name == file.Name;
        }) == undefined) 
        {
        config.recents.unshift({
            Id: file.Id,
            Name: file.Name,
            folder: {
                Name: file.folder.Name
            }
        });
    } else {
        config.recents.unshift(config.recents.removeById(file)[0]);
    }


    if (config.recents.length == config.recentMax) config.recents.pop();

    if (!$('#recent').hasClass('d-none')) {
        loadList('#list-recent', config.recents);
    }
};



/***********************************************************/

$('#openFile').on('click', function () {

    dialog.showOpenDialog(mainWindow, {
        title: "Select the file to open",
        filters: [{
                name: 'Videos',
                extensions: ['mp4', 'mkv']
            },
            {
                name: 'All Files',
                extensions: ['*']
            }
        ]
    }, function (fileNames) {
        if (fileNames !== undefined && fileNames.length > 0) {
            filename = fileNames[0];
            basedir = path.dirname(filename);
            LoadVideo(filename);
        }
    });
});

/******************************************************/
$('#viewer').mousedown(event => {
    event.which === 1 ? nextImg() : prevImg();
    $('#viewer').focus();
});

/******************************************************/

function backToFileBrowser() {
    cleanUpViewer();
    $('#viewer').addClass('hidden');
    $('#file-browser').removeClass('hidden');
    var item = $('.items').toArray().filter((t) => {
        return $(t).attr('data-name') === path.basename(filename);
    });
    selectItem($('.items').index(item[0]));
    $('.clock').removeClass('clock-50up');
    updateFilePage(filename, pageNum);
    filesList = allFiles;
}

/****Viewer Config****/



ViewerKeyUp = (event) => {

    var wasProcesed = false;
    if (!$('#viewer').hasClass('hidden') && event.target.type !== 'number')
        switch (event.keyCode) {
            case 13:
                {
                    setfullscreen();
                    wasProcesed = true;
                    break;
                }
            case 37:
                {
                    if (event.ctrlKey) {
                        prevFile();
                    } else {
                        prevImg();
                    }
                    wasProcesed = true;
                    break;
                }
            case 38:
                {
                    if (event.ctrlKey) {
                        backToFileBrowser();
                        break;
                    }
                    wasProcesed = true;
                    break;
                }
            case 39:
                {
                    if (event.ctrlKey) {
                        nextFile();
                    } else {
                        nextImg();
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

$(document).keyup(ViewerKeyUp);