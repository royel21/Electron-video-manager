
const { ipcRenderer } = require('electron');
const WinDrive = require('win-explorer');
const dialog = app.dialog;
const fs = require('fs-extra');
const path = require('path');
const local = localStorage;
var config = {
    recents: [],
    recentMax: 50,
    favId: 1,
    lastDir: "",
    scanFolder: [],
    imgScale: 0.6,
    sortBy: "",
    pageAnimation: "Slide",
    animDuration: 200
};

compressFilter = ['zip', 'rar','cbr'];
videoFilter = ['mp4', 'mkv', 'avi', 'webm','ogg'];
imagesFilter = ['png', 'gif', 'jpg', 'jpeg', 'webp', 'bmp'];

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

Storage.prototype.setObject = function (key, value) {
    this.setItem(key, JSON.stringify(value));
}

Storage.prototype.getObject = function (key) {
    var value = this.getItem(key);
    if (value == "undefined") return {};
    return value && JSON.parse(value);
}

Storage.prototype.hasObject = (key) => {
    return  local.getObject(key) != null && !$.isEmptyObject(local.getObject(key));
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
