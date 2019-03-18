const {
    app,
    BrowserWindow,
    ipcMain
} = require('electron');

const os = require('os');
const fs = require('fs-extra');
const path = require('path');
const db = require('./webcontent/models/models');


// this should be placed at top of main.js to handle setup events quickly
if (handleSquirrelEvent(app)) {
    // squirrel event handled and app will exit in 1000ms, so don't do anything else
    return;
}

// require('electron-reload')(__dirname, {
//     electron: path.join(__dirname, 'node_modules', '.bin', 'electron')
// });

let win;
var closeNow = false;
function createWin() {
    win = new BrowserWindow({
        title: "MangaViewer",
        minHeight: 350,
        minWidth: 700,
        show: false,
        transparent: true,
        frame: false,
        icon: path.join(__dirname, 'assets/icons/myicon-256.png')
    });
    win.setMenu(null);
    win.loadURL('file://' + __dirname + '/index.html');
    win.on('ready-to-show', () => {
        win.show();
    });


    win.on('close', (e) => {
        if (closeNow) {
            app.quit();
        } else {
            e.preventDefault();
            win.webContents.send('save-file', "");
            closeNow = true;
        }
        // app.quit();
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
    win.openDevTools();
}

ipcMain.on('console-log', (event, msg) => {
    console.log(msg);
});


ipcMain.on('close', (event, file) => {
    console.log(file);
    app.quit();
});

app.commandLine.appendSwitch("--disable-http-cache");

app.on('close', (e) => {
    win = null;
});
//Create the window when electron is ready
app.on('ready', createWin);

//Release the resource when the window is close+


if (!fs.existsSync(path.join(__dirname, 'covers'))) {
    fs.mkdirSync(path.join(__dirname, 'covers'));
    fs.mkdirSync(path.join(__dirname, 'covers/videos'));
}

var dbPath = path.join(os.homedir(), './.mangas-common/');

if (!fs.existsSync(dbPath)) {
    fs.mkdirsSync(dbPath);
}

app.setPath('userData', path.join(os.homedir(), '.RCVideoPlayer'));



function handleSquirrelEvent(application) {
    if (process.argv.length === 1) {
        return false;
    }

    const ChildProcess = require('child_process');
    const path = require('path');

    const appFolder = path.resolve(process.execPath, '..');
    const rootAtomFolder = path.resolve(appFolder, '..');
    const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
    const exeName = path.basename(process.execPath);

    const spawn = function (command, args) {
        let spawnedProcess, error;

        try {
            spawnedProcess = ChildProcess.spawn(command, args, {
                detached: true
            });
        } catch (error) { }

        return spawnedProcess;
    };

    const spawnUpdate = function (args) {
        return spawn(updateDotExe, args);
    };

    const squirrelEvent = process.argv[1];
    switch (squirrelEvent) {
        case '--squirrel-install':
        case '--squirrel-updated':
            // Optionally do things such as:
            // - Add your .exe to the PATH
            // - Write to the registry for things like file associations and
            //   explorer context menus

            // Install desktop and start menu shortcuts
            spawnUpdate(['--createShortcut', exeName]);

            setTimeout(application.quit, 1000);
            return true;

        case '--squirrel-uninstall':
            // Undo anything you did in the --squirrel-install and
            // --squirrel-updated handlers

            // Remove desktop and start menu shortcuts
            spawnUpdate(['--removeShortcut', exeName]);

            setTimeout(application.quit, 1000);
            return true;

        case '--squirrel-obsolete':
            // This is called on the outgoing version of your app before
            // we update to the new version - it's the opposite of
            // --squirrel-updated

            application.quit();
            return true;
    }
};