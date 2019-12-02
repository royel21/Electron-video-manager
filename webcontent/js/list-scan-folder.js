var $modalScnList;

createFRow = (id, dir) => {
    return `<li id="f-${id}" data-dir="{dir}" class="list-group-item">
    <span class="f-delete">
        <i class="fas fa-trash-alt"></i>
    </span>
    <span class="f-reload">
        <i class="fa fa-sync"></i>
    </span>
    <span>${dir}</span>
</li>`
}

$('#scan-list-show').click((e) => {
    if ($modalScnList == undefined) {
        $modalScnList = $(template('./template/modal-scan.html', {}));

        $('.content').prepend($modalScnList);
        for (var fd of config.scanFolder) {
            $('#scan-list').append(createFRow(fd.Id, fd.dir));
        }
        $modalScnList.find('#list-add-folder').click(() => {
            dialog.showOpenDialog(mainWindow, {
                title: "Select folder",
                properties: ['openDirectory']
            }).then(result => {
                console.log(result)
                if (!result.canceled) {
                    if (!config.scanFolder.find((f) => { return f.dir == result.filePaths[0]; })) {
                        var id = 0;
                        var lastId = config.scanFolder.last;
                        let dir = result.filePaths[0];
                        if (config.scanFolder.length > 0) id = lastId ? lastId.Id + 1 : 0;

                        config.scanFolder.push({
                            Id: id,
                            dir
                        });

                        createBackgroundWin('reload-Db', {
                            folders: [{
                                Id: id,
                                dir
                            }]
                        });
                        var fRow = `<li id="f-${id}" data-dir="{dir}" class="list-group-item">
                                        <span class="f-delete">
                                            <i class="fas fa-trash-alt"></i>
                                        </span>
                                        <span class="f-reload">
                                            <i class="fas fa-fa-sync"></i>
                                        </span>
                                        <span>${dir}</span>
                                    </li>`
                        $('#scan-list').append(fRow);
                        $('#folder-reloading .fa-database').removeClass('d-none');
                    }
                }
            });

        });

        $modalScnList.find('#list-sync-folder').click(() => {
            $('#folder-reloading .fa-database').removeClass('d-none');
            createBackgroundWin('reload-Db', {
                folders: config.scanFolder,
                resetDb: true
            });
        });
        $modalScnList.find('.f-reload').click((e) => {
            var id = e.target.closest('li').id.replace("f-", "")
            $('#folder-reloading .fa-database').removeClass('d-none');
            console.log(config.scanFolder[id], id)
            createBackgroundWin('reload-Db', {
                folders: [config.scanFolder[id]],
                resetDb: false
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
