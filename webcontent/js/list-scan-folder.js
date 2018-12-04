var $modalScnList;

$('#scan-list-show').click((e) => {
    if ($modalScnList == undefined) {
        $modalScnList = $(template('./template/modal-scan.html', {}));

        $('.content').prepend($modalScnList);
        for (var fd of config.scanFolder) {
            $('#scan-list').append(template('./template/folder-row.html', fd));
        }
        $modalScnList.find('#list-add-folder').click(() => {
            var dir = dialog.showOpenDialog(mainWindow, {
                title: "Select folder",
                properties: ['openDirectory']
            });
            if (dir) {
                if (config.scanFolder.find((f) => {
                    return f.dir == dir[0];
                }) == undefined) {
                    var id = 0;
                    if (config.scanFolder.length > 0) id = config.scanFolder.last.Id + 1;
                    config.scanFolder.push({
                        Id: id,
                        dir: dir[0]
                    });
                    createBackgroundWin('reload-Db', {
                        folders: [{
                            Id: id,
                            dir: dir[0]
                        }],
                        filter: config.fileFilters
                    });
                    $('#scan-list').append(template('./template/folder-row.html', {
                        id,
                        dir: dir[0]
                    }));
                }
            }
        });

        $modalScnList.find('#list-sync-folder').click(() => {
            $('#folder-reloading .fa-database').removeClass('d-none');
            console.log('reload')
            createBackgroundWin('reload-Db', {
                folders: config.scanFolder,
                filters: config.fileFilters
            });
        });

        $modalScnList.find('#close-modal').click(() => {
            hideModal($modalScnList);
            $modalScnList = undefined;
        });
        positionModal(e, $modalScnList);
        $modalScnList.fadeIn('slow');

        var $filterSelete = $modalScnList.find('#filter-select');
        config.fileFilters.forEach(function (name, i) {
            $filterSelete.append($(`<option value="${i}">${name}</option>"`));
        });

        $modalScnList.on('dblclick', 'ul li', (event) => {
            var li = event.target.closest('li');
            basedir = li.dataset.dir;
            loadDirectory('');
        });
    }
});

$('.content').on('click', ' #scan-list .fa-trash-alt', (event) => {
    var $li = $(event.target.closest('li'));
    $li.fadeOut('fast', () => {
        $li.remove();
    })
    config.scanFolder.removeById({
        Id: $li[0].id.replace('f-', '')
    });
});


$('.content').on('click', ' #scan-footer .fa-trash-alt', (event) => {

    var x = document.getElementById("filter-select");
    if (x.value != "zip") {
        config.fileFilters.splice(x.selectedIndex, 1);
        x.remove(x.selectedIndex);
    }
});

var $dialog;

$('.content').on('click', ' #scan-footer #add-filter', (e) => {
    if ($dialog == undefined) {
        $dialog = $(template('./template/create-dialog.html', {
            title: "Create Filter",
            btn1: "Create"
        }));

        $('.content').prepend($dialog);
        $dialog.find('#create').click(() => {
            var name = $('#name').val();
            var $filter = $modalScnList.find('#filter-select');
            $filter.prepend($(`<option value="${name}" selected>${name}</option>"`));
            if (!config.fileFilters.includes(name))
                config.fileFilters.push(name);
            config.fileFilters.sort();
            hideDialog();
        });
        $dialog.find('#close').click(hideDialog);
    }

    $dialog.css({
        zIndex: 999,
        minHeight: 150,
        height: 150,
        left: -4000,
        width: 300
    });
    $dialog.css({
        left: e.clientX,
        top: e.clientY - 177
    });
    $dialog.fadeIn('slow');
});


hideDialog = function () {
    $dialog.fadeOut('fast', () => {
        $dialog.remove();
        $dialog = undefined;
    });
};