const {
    app,
    BrowserWindow,
    ipcMain
} = require('electron');

const os = require('os');
const fs = require('fs-extra');
const path = require('path');

// require('electron-reload')(__dirname, {
//     electron: path.join(__dirname, 'node_modules', '.bin', 'electron')
// });

let win;

function createWin() {
    win = new BrowserWindow({
        title: "MangaViewer",
        minHeight: 580,
        minWidth: 750,
        show: false,
        transparent: true,
        frame: false,
    });
    //win.setMenu(null);
    win.loadURL('file://' + __dirname + '/index.html');
    win.on('ready-to-show', () => {
        win.show();
    });


    win.on('close', () => {
        app.quit();
    });

    //This is used in mac for recreate the window
    app.on('active', () => {
        if (win === null) {
            createWin();
        }
    });

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });
    // win.openDevTools();
    // win.setAlwaysOnTop(true);
}

ipcMain.on('console-log', (event, msg) => {
    console.log(msg);
});

app.commandLine.appendSwitch("--disable-http-cache");
app.on('close', () => {
    win = null;
});
//Create the window when electron is ready
app.on('ready', createWin);

//Release the resource when the window is close+


if (!fs.existsSync(path.join(__dirname, 'covers'))) {
    fs.mkdirSync(path.join(__dirname, 'covers'));
}

var dbPath = path.join(os.homedir(),'./.mangas-common/');

if (!fs.existsSync(dbPath)) {
    fs.mkdirsSync(dbPath);
}

app.setPath('userData', path.join(os.homedir(), '.RCVideoPlayer'));