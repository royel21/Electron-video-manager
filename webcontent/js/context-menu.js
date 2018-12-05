var cpyFile;
var $dialogDetails;

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

$('#file-list').on('mousedown', '.items', (e) => {
    if ($(e.target).closest('.item-btns')[0] != undefined) return;
    if (e.which === 3) {
        $cmenu.css({
            top: e.clientY + 4,
            left: e.clientX + 4
        });

        keepIn(e, $cmenu);

        $cmenu.css({
            display: "block"
        });
        if ($(e.target.closest(".items")).data('isfile')) {
            $('#cm-file-rename').css({ display: "block" });
        } else {
            $('#cm-file-rename').css({ display: "none" });
        }
        cpyFile = $(e.target.closest(".items")).data('name');
    }
});

$('#cm-cp-name').click((e) => {
    clipboard.writeText(formatName(cpyFile, 0).split('.')[0]);
    $cmenu.css({
        display: "none"
    });
});

$('#cm-cp-path').click((e) => {
    clipboard.writeText(path.join(basedir, cpyFile));
    $cmenu.css({
        display: "none"
    });
});
$('#cm-zip-file').click((e) => {
    $('.fa-file-archive').removeClass('d-none');
    createBackgroundWin('zip-file', { dir: path.join(basedir, cpyFile) });
    compressingCount++;
    $cmenu.css({
        display: "none"
    });
});

$('#cm-sh-details').click((e) => {
    db.File.findOne({ where: { Name: cpyFile } }).
        then(file => {
            hidedetails();
            var tempf = WinDrive.ListFiles(path.join(basedir, cpyFile), [], true)[0];
            tempf.Page = file != null ? file.CurrentPage + 1 : 0;
            tempf.TotalPage = file != null ? file.TotalPage : 0;
            var date = new Date(tempf.LastModified);
            tempf.Date = date.toLocaleDateString("en-US") + " " + date.toLocaleTimeString("en-US");
            tempf.Size = FormattBytes(tempf.Size);
            $dialogDetails = $(template('./template/modal-details.html', tempf));
            $('#file-viewer').prepend($dialogDetails);

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
        })
    $cmenu.css({
        display: "none"
    });
});
hidedetails = () => {
    if ($dialogDetails != undefined) {
        hideModal($dialogDetails);
        $dialogDetails = undefined;
    }
}

$('#cm-file-rename').click((e) => {
    dialogBox({ title: "New Name:", x: e.clientX, y: e.clientY, data: cpyFile, btn1: "Rename" }).then(result => {
        if (result.length > 0) {
            var oldFile = path.join(basedir, cpyFile);
            var newFile = path.join(basedir, result);
            fs.renameSync(oldFile, newFile);
            var oldCover = path.join('./covers', cpyFile + ".jpg");
            if (fs.existsSync(oldCover)) {
                var newCover = path.join('./covers', result + ".jpg");
                fs.renameSync(oldCover, newCover);
                var $item = $('.items:textequalto(' + cpyFile + ')');
                $item.attr('data-name', result).data('name', result);
                $item.find('.item-name').text(result);
                var img = $item.find('img').get(0);
                img.dataset.src = img.src = newCover;
            }
            db.File.update({ Name: result }, { where: { Name: cpyFile } });
        }
    });
    $cmenu.css({
        display: "none"
    });
});

$(document.body).click(() => { $cmenu.css({ display: "none" }); });
$(contentScroll).scroll(() => { hidedetails(); $cmenu.css({ display: "none" }) });
$(window).resize(() => { hidedetails(); $cmenu.css({ display: "none" }) });

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
            hideCreateFav();
        });
        $dialog.find('#close').click(() => {
            hideCreateFav();
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