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
                        }]
                    });

                    $('#scan-list').append(template('./template/folder-row.html', {
                        id,
                        dir: dir[0]
                    }));
                    $('#folder-reloading .fa-database').removeClass('d-none');
                }
            }
        });

        $modalScnList.find('#list-sync-folder').click(() => {
            $('#folder-reloading .fa-database').removeClass('d-none');
            console.log('reload')
            createBackgroundWin('reload-Db', {
                folders: config.scanFolder
            });
        });

        $modalScnList.find('#close-modal').click(() => {
            hideModal($modalScnList);
            $modalScnList = undefined;
        });
        positionModal(e, $modalScnList);
        $modalScnList.fadeIn('slow');

        $modalScnList.on('dblclick', 'ul li', (event) => {
            var li = event.target.closest('li');
            currentDir = li.dataset.dir;
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
