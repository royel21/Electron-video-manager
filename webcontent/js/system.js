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
$('#btn-sys-min').on('click', minWindow);
$('#btn-sys-max').on('click', maxWindow);
$('.btn-sys-close').on('click', closeWindow);
$('.btn-fullscr').on('click', setfullscreen);

goToRoots = async () => {
    $('#title').text("Home");
    var diskIcon = './webcontent/image/hard-disk-256.png'
    $('#file-list').empty();
    var dir = basedir;
    basedir = '';
    
    folderId = null;
    await loadFavs();
    var drives = WinDrive.ListDrivesInfo().filter(d=> d.Type !== 5);
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
    localStorage.setItem('basedir', '');
    lazyLoad();
    toggleViewer(false);
}
$('#btn-home').click(goToRoots);

/****************Resize*******************************************/