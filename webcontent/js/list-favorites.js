var $favList = $('#list-favs');
var $selFav = $('#fav-select');
var $fav_dialog;

$('#fav-create').click((e) => {
    if ($fav_dialog == undefined) {
        $fav_dialog = $(template('./template/create-dialog.html', {
            title: "Create Favorite"
        }));

        $('.content').prepend($fav_dialog);
        $fav_dialog.find('#create').click(() => {
            db.FavoriteVideo.create({
                Name: $('#name').val()
            }).then(fav => {
                CurrentFav = fav;
                $selFav.prepend($(`<option value="${fav.id}" selected>${fav.Name}</option>"`));
                config.favId = fav.id;
                hideCreateFav();
            });
        });
        $fav_dialog.find('#close').click(hideCreateFav);
    }

    $fav_dialog.css({
        zIndex: 999,
        minHeight: 150,
        height: 150,
        width: 300,
        left: e.clientX,
        top: e.clientY - 177
    });

    $fav_dialog.fadeIn('slow');
});

$('#fav-remove').click((e) => {
    var id = $selFav.val();
    db.FavoriteVideo.destroy({
        where: {
            Id: id
        }
    }).then((fav) => {
        if (fav > 0) {
            $selFav[0].remove($selFav[0].selectedIndex);
            if ($selFav.children().length > 0) {
                config.favId = $selFav.val();
            } else {
                config.favId = -1;
                db.db.query("DELETE FROM sqlite_sequence WHERE name = 'FavoriteVideos';").catch(err => {
                    console.log(err);
                });
            }
        }
        loadFavFiles();
    });
});
hideCreateFav = function () {
    $fav_dialog.fadeOut('fast', () => {
        $fav_dialog.remove();
        $fav_dialog = undefined;
    });
};

$selFav.change(e => {
    config.favId = $selFav.val();
    loadFav();
});

loadFav = function () {
    if ($selFav.children().length == 0) {
        db.FavoriteVideo.findAll().then(favs => {
            for (var f of favs) {
                var selected = '';
                if (f.id == config.favId) {
                    selected = "selected";
                    config.favId = f.Id;
                }
                $selFav.append(`<option value="${f.id}" ${selected}>${f.Name}</option>"`)
            }
            loadFavFiles();
        });
    } else
        loadFavFiles();
}

loadFavFiles = () => {
    if (config.favId > 0) {
        db.FavoriteVideo.findById(config.favId).then(fav => {
            if (fav != undefined) {
                db.VideoFile.findAll({
                    where: {
                        FavoriteVideoId: fav.id
                    },
                    include: {
                        model: db.Folder
                    }
                }).then(files => {
                    if (files.length == 0) {
                        $('#fav-found').text("");
                    } else {
                        $('#fav-found').text(files.length);
                    }
                    loadList('#list-favs', files);
                });
            }
        });
    } else {
        $('#fav-found').text("");
        loadList('#list-favs', []);
    }
}

$('.list-file-content').on('click', '#list-favs #delete-list', (event) => {
    var li = event.target.closest('li');
    var id = li.id.replace("file-", "");
    db.VideoFile.findOne({
        where: {
            id: id
        }
    }).then((f) => {
        f.updateAttributes({
                favoritevideoId: null
            })
            .then(() => {
                $(li).fadeOut('fast', () => {
                    $(li).remove();
                    var t = $('#fav-found').text();
                    $('#fav-found').text(t - 1);
                });
            });
    });
});