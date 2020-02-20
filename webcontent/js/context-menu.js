const {
    clipboard
} = require('electron');
const shell = require('electron').shell;

var cmenu = document.getElementById('context-menu');
var cpyFile;
var dialogDetails;

hideCMenu = () => cmenu.style.display = "none";

keepIn = (e, el) => {
    if (e.clientY + el.offsetHeight > window.innerHeight) {
        el.style.top = (e.clientY - el.offsetHeight) + "px";
    }

    if (e.clientX + el.offsetWidth > window.innerWidth) {

        el.style.left = (e.clientX - el.offsetWidth) + "px";
    }
}

showCtxMenu = (name, isfile, e) => {
    cmenu.style.top = e.clientY + 4 + "px";
    cmenu.style.left = e.clientX + 4 + "px";

    $('#cm-zip-file').css({
        display: isfile ? "none" : "block"
    });
    $('#cm-file-rename').css({
        display: isfile ? "block" : "none"
    });
    $('#cm-open-with-default').css({
        display: isfile ? "block" : "none"
    });
    db.File.findByName({
        Name: name
    }).then(f => {
        cpyFile = {
            Name: name,
            Current: 0,
            fullPath: path.join(currentDir, name),
            Total: 0,
            Size: 0
        };
        if (f) {
            cpyFile.Current = f.Current;
            cpyFile.fullPath = path.join(f.folder.Name, name);
            cpyFile.Total = f.Total;
        }
    });
    cmenu.style.display = "block";

    console.log("cmenu1");
    keepIn(e, cmenu);
}

$('#file-list').on('mousedown', '.items', (e) => {
    if (e.target.closest('.item-btns') != undefined) return;
    if (e.which === 3) {
        var item = e.target.closest(".items");
        showCtxMenu(item.dataset.name, item.dataset.isfile == "true", e);
    } else {
        hideCMenu();
    }
});

$('#cm-open-with-default').click((e) => {
    shell.showItemInFolder(cpyFile.fullPath);
    hideCMenu();
});
$('#cm-cp-name').click((e) => {
    clipboard.writeText(nameFormat(cpyFile.Name, 0).split('.')[0]);
    hideCMenu();
});

$('#cm-cp-path').click((e) => {
    clipboard.writeText(cpyFile.fullPath);
    hideCMenu();
});
$('#cm-zip-file').click((e) => {
    $('.fa-file-archive').removeClass('d-none');
    createBackgroundWin('zip-file', {
        dir: cpyFile.fullPath
    });
    compressingCount++;
    hideCMenu();
});

$('#cm-sh-details').click((e) => {

    hidedetails();
    var tempf = WinDrive.ListFiles(cpyFile.fullPath, [], true)[0];
    if (videoFilter.includes(tempf.extension)) {
        tempf.Page = formatTime(cpyFile.Current);
        tempf.Total = formatTime(cpyFile.Total);
    } else {
        tempf.Page = cpyFile.Current;
        tempf.Total = cpyFile.Total;
    }

    var date = new Date(tempf.LastModified);
    tempf.Date = date.toLocaleDateString("en-US") + " " + date.toLocaleTimeString("en-US");
    let div = document.createElement('div');
    div.innerHTML =
        `<div id="modal-details" class="modal bg-dark card">
                            <div class="dialog-header text-center move">
                                <span class="m-title">Details</span>
                                <span id="modal-close" class="btn-hide"><i class="far fa-times-circle"></i></span>
                            </div>
                            <div id="details-body">
                                <div><span>Name: </span>${tempf.FileName}</div>
                                <div><span>Current: </span>${tempf.Page}</div>
                                <div><span>Total: </span>${tempf.Total}</div>
                                <div><span>Extension: </span>${tempf.extension}</div>
                                <div><span>Size: </span>${FormattBytes(tempf.Size)}</div>
                                <div><span>Last Modified: </span>${tempf.Date}</div>
                            </div>
                    </div>`
    dialogDetails = div.firstElementChild;
    console.log(dialogDetails);
    dialogDetails.querySelector('#modal-close').onclick = hidedetails;

    dialogDetails.style.top = e.clientY + "px";
    dialogDetails.style.left = e.clientX + "px";
    dialogDetails.offsetHeight = dialogDetails.querySelector('#details-body').offsetHeight + 50;
    dialogDetails.style.display = "block";
    $('.content').prepend(dialogDetails);
    hideCMenu();
});

hidedetails = () => {
    if (dialogDetails != undefined) {
        dialogDetails.remove();
        dialogDetails = undefined;
    }
}

$('#cm-file-rename').click((e) => {
    dialogBox({
            title: "New Name:",
            x: e.clientX,
            y: e.clientY,
            data: cpyFile.Name,
            btn1: "Rename"
        })
        .then(result => {
            if (result.length > 0) {
                $('#loadingDiv').removeClass('d-none');
                console.time('A');
                var waitingTime = setTimeout(() => {
                    var oldFile = cpyFile.fullPath;
                    var newFile = path.join(path.dirname(cpyFile.fullPath), result);
                    fs.renameSync(oldFile, newFile);
                    db.File.update({
                        Name: result
                    }, {
                        where: {
                            Name: cpyFile.Name
                        }
                    }).catch(err => {});
                    var newCover;
                    var oldCover;
                    var icon = "&#xf03d; ";
                    if (videoFilter.includes(cpyFile.Name.split('.').pop())) {
                        var imgs = WinDrive.ListFiles('./covers/videos/', ['png']).filter(f => {
                            return f.FileName.includes(cpyFile.Name);
                        });
                        for (var f of imgs) {
                            oldCover = path.join('./covers/videos/', f.FileName);
                            if (fs.existsSync(oldCover)) {
                                newCover = oldCover.replace(f.FileName.split('-')[0], result);
                                fs.renameSync(oldCover, newCover);
                            }
                        }
                    } else {
                        oldCover = path.join('./covers', cpyFile.Name + ".jpg");
                        if (fs.existsSync(oldCover)) {
                            newCover = path.join('./covers', result + ".jpg");
                            fs.renameSync(oldCover, newCover);
                        }
                        icon = "&#xf1c6; ";
                    }

                    var item = document.querySelector('.items[data-name="' + cpyFile.Name + '"]');
                    if (item) {
                        item.setAttribute('data-name', result);
                        item.dataset.name = result;
                        item.querySelector('.item-name').textContent = result;
                        var img = item.querySelector('img');
                        img.dataset.src = img.src = newCover.replace('-3', '-0');
                    }

                    var li = document.querySelector('li[data-title="' + cpyFile.Name + '"]');
                    if (li) {
                        li.setAttribute('data-title', result);
                        li.querySelector('.list-text').innerHTML = `${icon}${result}`;
                    }
                    $('#loadingDiv').addClass('d-none');

                    console.timeEnd('A');
                    clearTimeout(waitingTime);
                });
            }
        });
    cmenu.style.display = "none";
});


dialogBox = (data, cb) => {
    return new Promise((resolve, reject) => {
        var $dialog = $(template('./template/create-dialog.html', {
            title: data.title,
            btn1: data.btn1
        }));
        var $nameBox = $dialog.find('#name');
        $nameBox.val(data.data);

        $nameBox.keydown(e => {
            if (e.keyCode === 13) {
                resolve($nameBox.val());
                $dialog.fadeOut('fast', () => {
                    $dialog.remove();
                    $dialog = undefined;
                });
            }
        });

        $('.content').prepend($dialog);
        $dialog.find('#create').click(() => {
            resolve($nameBox.val());
            $dialog.fadeOut('fast', () => {
                $dialog.remove();
                $dialog = undefined;
            });
        });
        $dialog.find('#close').click(() => {
            hideCreateFav();
            $dialog.fadeOut('fast', () => {
                $dialog.remove();
                $dialog = undefined;
            });
            resolve("");
        });

        $dialog.css({
            zIndex: 9999,
            minHeight: 150,
            height: 150,
            width: 300,
            left: data.x,
            top: data.y
        });

        $dialog.fadeIn('slow');
        $nameBox.keydown((e) => {
            e.stopPropagation()
        });
        $nameBox.keypress((e) => {
            e.stopPropagation()
        });
    });
}

$(document).on("click", (e) => { hideCMenu(); })