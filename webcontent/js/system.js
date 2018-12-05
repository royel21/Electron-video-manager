
const app = require('electron').remote;
const mainWindow = app.getCurrentWindow();
var isMaximized = false;

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
}
$('#btn-sys-min').on('click', minWindow);
$('#btn-sys-max').on('click', maxWindow);
$('.btn-sys-close').on('click', closeWindow);
$('.btn-fullscr').on('click', setfullscreen);

