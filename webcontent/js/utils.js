const ipcRenderer = require('electron').ipcRenderer;
const app = require('electron').remote;
const WinDrive = require('win-explorer');
const dialog = app.dialog;
const fs = require('fs-extra');
const path = require('path');
const db = require('./webcontent/entity/models')
const local = localStorage;
const mainWindow = app.getCurrentWindow();
var basedir = "";
var config = {
    recents: [],
    recentMax: 50,
    favId: -1,
    lastDir: "",
    scanFolder: [],
    imgScale: 0.6,
    fileFilters: ['mp4','mkv','ogg']
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
    var win = new BrowserWindow({
        width: 1000,
        height: 1000,
        show: true
    });
    win.loadURL(invisPath);
    win.webContents.on('did-finish-load', () => {
        try {
            win.webContents.send(event, data, windowID);
        } catch (error) {}
    });
    win.on('closed', (e) => {
        console.log('win-close');
        win = null;
    });
}

toggleViewer = (isViewer) => {
    if (isViewer === true) {
        $('#file-browser').addClass('hidden');
        $('#viewer').removeClass('hidden');
        $('#total-files').removeClass('hidden');
    } else {
        $('#file-browser').removeClass('hidden');
        $('#viewer').addClass('hidden');
        $('#total-files').addClass('hidden');
    }
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
        return $(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
    };
});

lazyLoad = () => {
    var lazyCovers = document.querySelectorAll('.item-file');
    var lazyImageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            let lazyCover = entry.target.querySelector('img');
            if (entry.isIntersecting) {
                lazyCover.src = lazyCover.dataset.src;
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
            return this.splice(i, 1);
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
                    if (showloading) $('#loadingDiv').addClass('d-none');
                }
            }
            resolve(resp);
        });
    });
}

JumpFolder = (num) => {
    if (basedir == "") return;

    try {
        //get root dir
        var dir = path.dirname(basedir);
        //list all folder in root dir
        var folders = WinDrive.ListFiles(dir).filter(f => {
            return f.isDirectory && !f.isHidden
        }).map(a => a.FileName);
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

updateFilePage = (file, page) => {
    if (file != undefined) {
        db.VideoFile.findOne({
            where: {
                Name: path.basename(file)
            }
        }).then((f) => {
            if (file != null)
                f.updateAttributes({
                    CurrentPos: page
                });
        });
    }
}

function FormattBytes(b) {
    var div = [];
    var mul = 1024
    if (typeof b === 'number') {
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
var timer;