const { clipboard } = require('electron');
const shell = require('electron').shell;

var cpyFile;
var $dialogDetails;
var isItem;
keepIn = (e, $el) => {
    if (e.clientY + $el.height() > window.innerHeight) {
        $el.css({
            top: e.clientY - $el.height()
        });
    }

    if (e.clientX + $el.width() > window.innerWidth) {
        $el.css({
            left: e.clientX - $el.width()
        });
    }
}
showCtxMenu = (name, isfile, e) => {
    $cmenu.css({
        top: e.clientY + 4,
        left: e.clientX + 4
    });
    keepIn(e, $cmenu);

    $('#cm-zip-file').css({ display: isfile ? "none" : "block" });
    $('#cm-file-rename').css({ display: isfile ? "block" : "none" });
    $('#cm-open-with-default').css({ display: isfile ? "block" : "none" });
    db.File.findByName({ Name: name }).then(f => {
        cpyFile = { Name: name, Current: 0, fullPath: path.join(currentDir, name), Total: 0, Size: 0 };
        if (f) {
            cpyFile.Current = f.Current;
            cpyFile.fullPath = path.join(f.folder.Name, name);
            cpyFile.Total = f.Total;
        }
    });

    $cmenu.css({
        display: "block"
    });
}

$('#file-list').on('mousedown', '.items', (e) => {
    if ($(e.target).closest('.item-btns')[0] != undefined) return;
    if (e.which === 3) {
        isItem = true;
        var $item = $(e.target.closest(".items"));
        showCtxMenu($item.data('name'), $item.data('isfile'), e);
    } else {
        $cmenu.css({
            display: "none"
        });
    }
    cpyFile = undefined;
});

$('#cm-open-with-default').click((e) => {
    shell.openItem(cpyFile.fullPath);
    $cmenu.css({
        display: "none"
    });
    cpyFile = undefined;
});
$('#cm-cp-name').click((e) => {
    clipboard.writeText(nameFormat(cpyFile.Name, 0).split('.')[0]);
    $cmenu.css({
        display: "none"
    });
    cpyFile = undefined;
});

$('#cm-cp-path').click((e) => {
    clipboard.writeText(cpyFile.fullPath);
    $cmenu.css({
        display: "none"
    });
    cpyFile = undefined;
});
$('#cm-zip-file').click((e) => {
    $('.fa-file-archive').removeClass('d-none');
    createBackgroundWin('zip-file', { dir: cpyFile.fullPath });
    compressingCount++;
    $cmenu.css({
        display: "none"
    });
    cpyFile = undefined;
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
    tempf.Size = FormattBytes(tempf.Size);
    $dialogDetails = $(template('./template/modal-details.html', tempf));

    $('.content').prepend($dialogDetails);
    $dialogDetails.find('#modal-close').click(() => {
        hidedetails();
    });

    $dialogDetails.css({
        left: e.clientX,
        top: e.clientY
    });
    keepIn(e, $dialogDetails);
    $dialogDetails.fadeIn('fast', () => {
        $dialogDetails.css({ height: $dialogDetails.find('#details-body').height() + 50 });
    });

    $cmenu.css({
        display: "none"
    });
    cpyFile = undefined;
});

hidedetails = () => {
    if ($dialogDetails != undefined) {
        hideModal($dialogDetails);
        $dialogDetails = undefined;
    }
}

$('#cm-file-rename').click((e) => {
    dialogBox({ title: "New Name:", x: e.clientX, y: e.clientY, data: cpyFile.Name, btn1: "Rename" })
        .then(result => {
            if (result.length > 0) {
                $('#loadingDiv').removeClass('d-none');
                console.time('A');
                var waitingTime = setTimeout(() => {
                    var oldFile = cpyFile.fullPath;
                    var newFile = path.join(path.dirname(cpyFile.fullPath), result);
                    fs.renameSync(oldFile, newFile); 
                    db.File.update({ Name: result }, { where: { Name: cpyFile.Name } }).catch(err => { });
                    var newCover;
                    var oldCover;
                    var icon = "&#xf1c6; ";
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
                        icon = "&#xf03d; ";
                    }

                    var item = document.querySelector('.items[data-name="' + cpyFile.Name + '"]');
                    console.log(item);
                    // if ($item[0]) {
                    //     if ($item[0] != undefined) {
                    //         $item.attr('data-name', result).data('name', result);
                    //         $item.find('.item-name').text(result);
                    //         var img = $item.find('img').get(0);
                    //         img.dataset.src = img.src = newCover;
                    //     }
                    // }
                    var li = document.querySelector('li[data-title="' + cpyFile.Name + '"]');
                    console.log(li);
                    if (li) {
                        li.setAttribute('data-title', result);
                        li.querySelector('.list-text').textContent = icon + result;
                        console.log(li.querySelector('.list-text'));
                    }
                   $('#loadingDiv').addClass('d-none');
                    isItem = false;
                    console.log(result);
                    console.timeEnd('A');
                    clearTimeout(waitingTime);
                });
            }
        });
    $cmenu.css({
        display: "none"
    });
});

renameCover = (cover) => {

}

dialogBox = (data, cb) => {
    return new Promise((resolve, reject) => {
        var $dialog = $(template('./template/create-dialog.html', {
            title: data.title,
            btn1: data.btn1
        }));
        var $nameBox = $dialog.find('#name');
        $nameBox.val(data.data);
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
        $nameBox.keydown((e) => { e.stopPropagation() });
        $nameBox.keypress((e) => { e.stopPropagation() });
    });
}
