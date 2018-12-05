const ipcRenderer = require('electron').ipcRenderer;
const { clipboard } = require('electron');
const WinDrive = require('win-explorer');
const dialog = app.dialog;
const fs = require('fs-extra');
const path = require('path');
const db = require('./webcontent/entity/models')
const local = localStorage;
var basedir = "";
var config = {
    recents: [],
    recentMax: 50,
    favId: 1,
    lastDir: "",
    scanFolder: [],
    imgScale: 0.6,
    fileFilters: ['zip', 'rar'],
    videoFilters: ['mp4', 'mkv', 'avi', 'webm'],
    sortBy: "",
    pageAnimation: "Slide",
    animDuration: 200
};
var filesList = [];
var fileFound = [];

calCol = () => {
    if ($('#file-list').length !== 0) {
        var winW = window.innerWidth;
        var itemW = $('#file-list').children().get(0).offsetWidth + 10;
        var row = parseInt(winW / (itemW));
        return row;
    }
    return 0;
}

const BrowserWindow = app.BrowserWindow;

const invisPath = `file://${path.join(__dirname, 'background/createthumb.html')}`;
const windowID = mainWindow.id;

createBackgroundWin = (event, data) => {
    setTimeout(() => {
        var e = event;
        var d = data;
        var win = new BrowserWindow({
            width: 1,
            height: 1,
            show: false
        });
        win.loadURL(invisPath);
        win.webContents.on('did-finish-load', () => {
            try {
                win.webContents.send(e, d, windowID);
            } catch (error) { }
        });
        win.on('closed', (e) => {
            win = null;
        });
    }, 0)
}

toggleView = (view) => {
    switch (view) {
        case "ImageViewer": {
            $viewer.removeClass('d-none');
            $('#file-viewer').addClass('d-none');
            $vplayer.addClass('d-none');
            $('.clock').addClass('clock-50up');
            break;
        }
        case "FileViewer": {
            $('#file-viewer').removeClass('d-none');
            $vplayer.addClass('d-none');
            $viewer.addClass('d-none');
            $('.clock').removeClass('clock-50up clock-60up');
            break;
        }
        case "VideoViewer": {
            $vplayer.removeClass('d-none');
            $('#file-viewer').addClass('d-none');
            $viewer.addClass('d-none');
            $('.clock').addClass('clock-60up');
            break;
        }
    }
    $('.content').css({ 'overflow-y': !isPlayer() ? "auto" : "hidden" });
}

template = (file, data) => {
    var template = fs.readFileSync(path.join(__dirname, file), {
        encoding: 'utf-8'
    });
    for (var key in data) {
        var regex = new RegExp(eval("/({" + key + "})/ig"));
        template = template.replace(regex, data[key]);
    }
    return template;
}

$.expr[":"].contains = $.expr.createPseudo(function (arg) {
    return function (elem) {
        return $(elem).text().trim().toUpperCase().includes(arg.trim().toUpperCase());
    };
});

$.expr[":"].textequalto = $.expr.createPseudo(function (arg) {
    return function (elem) {
        return $(elem).text().trim().toUpperCase() === arg.trim().toUpperCase();
    };
});

lazyLoad = () => {
    var lazyCovers = document.querySelectorAll('.items');
    var lazyImageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            let lazyCover = entry.target.querySelector('img');
            if (entry.isIntersecting) {

                var ds = entry.target.dataset;
                var isVideo = config.videoFilter.includes(ds.ex);
                var icon = './covers/' + ds.name + (isVideo ? '.png' : '.jpg');

                if (fs.existsSync(icon)) {
                    lazyCover.src = icon.replace('#', '%23');
                } else {
                    lazyCover.src = lazyCover.dataset.src;
                }
            } else {
                lazyCover.src = "";
            }
        });
    }, {
            rootMargin: "384px 0px 384px 0px"
        });

    lazyCovers.forEach((lazyImg) => {
        lazyImageObserver.observe(lazyImg);
    });
}

Storage.prototype.setObject = function (key, value) {
    this.setItem(key, JSON.stringify(value));
}

Storage.prototype.getObject = function (key) {
    var value = this.getItem(key);
    if (value == "undefined") return [];
    return value && JSON.parse(value);
}

Number.prototype.map = function (in_min, in_max, out_min, out_max) {
    return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

Array.prototype.removeById = function (obj) {
    var i = this.length;
    while (i--) {
        if (this[i] instanceof Object && this[i].Id == obj.Id) {
            return this.splice(i, 1)[0];
        }
    }
}

Object.defineProperty(Array.prototype, "last", {
    get: function () {
        return this[this.length - 1];
    }
});

deleteFile = (file, showloading) => {
    return new Promise((resolve, rejected) => {
        dialog.showMessageBox(mainWindow, {
            type: 'warning',
            buttons: ['Yes', 'No'],
            message: 'Are you sure you want to delete ' + file + ' ?',
            checkboxLabel: 'Never ask me again',
            checkboxChecked: false,

        }, (resp, checkboxChecked) => {
            if (resp === 0) {
                if (fs.existsSync(file)) {
                    if (showloading) $('#loadingDiv').removeClass('d-none');
                    fs.removeSync(file);
                    var cover = path.join("./covers", path.basename(file) + ".jpg");
                    if (fs.existsSync(cover)) fs.removeSync(cover);
                    if (showloading) $('#loadingDiv').addClass('d-none');
                }
            }
            resolve(resp);
        });
    });
}

JumpFolder = (num) => {
    if (basedir == "" || !$('#image-viewer').hasClass('d-none')) return;

    try {
        //get root dir
        var dir = path.dirname(basedir);
        //list all folder in root dir
        var folders = WinDrive.ListFiles(dir).filter(f => {
            return f.isDirectory && !f.isd - none
        }).sort(sortFileBy).map(a => a.FileName);
        //get current folder
        var toJump = folders.indexOf(path.basename(basedir)) + num;
        //jump to next or previous folder
        if (toJump > -1 && toJump < folders.length) {
            basedir = dir;
            loadDirectory(folders[toJump]);
        } else {
            //if no pre or next folder then jump to root
            basedir = path.dirname(dir);
            dir = path.basename(dir);
            loadDirectory(dir);
        }

    } catch (error) {
        console.log(error);
    }
}

$(window).on('beforeunload', (e) => {
    local.setObject('config', config);
});

if (local.getObject('config') != null && !$.isEmptyObject(local.getObject('config'))) {
    config = local.getObject('config');
}

updateFilePage = (file, page, totalPage) => {
    if (file != undefined && !isImage) {
        return db.db.query(`UPDATE files set CurrentPage = ${page}, TotalPage = ${totalPage} WHERE Id = ${file.Id};`);
    }
}

function FormattBytes(b) {
    if (b === undefined) return "";

    if (typeof b === 'number') {
        var div = [];
        var mul = 1024
        switch (b) {
            case ((b >= 0 && b <= mul) ? b : -1):
                {
                    div.push(0)
                    div.push("B")
                    break;
                }
            case ((b >= mul && b <= mul ** 2) ? b : -1):
                {
                    div.push(1)
                    div.push("KB")
                    break;
                }
            case ((b >= mul ** 2 && b <= mul ** 3) ? b : -1):
                {
                    div.push(2)
                    div.push("MB")
                    break;
                }
            default:
                {
                    div.push(3)
                    div.push("GB")
                    break;
                }
        }
        return Number(b / 1024 ** div[0]).toFixed(2) + div[1];
    } else
        return "";
}

function formatName(name, padding = 3) {
    var str = name.replace(/[\\|?|<|>|*|:|"]/ig, '');
    var res1 = str.split(/\d+/g);
    var res2 = str.match(/\d+/g);
    var temp = "";
    if (res1 == null || res2 == null) return str;

    for (let [i, s] of res2.entries()) {
        temp += res1[i] + String(Number(s)).padStart(padding, 0);
    }

    var elem = document.createElement('textarea');
    elem.innerHTML = temp + res1[res1.length - 1];
    return elem.value;
}

isViewer = () => {
    return !$('#image-viewer').hasClass('d-none');
}