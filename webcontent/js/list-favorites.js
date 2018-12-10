var $favList = $('#list-favs');
var $selFav = $('#fav-select');
var $fav_dialog;
var $deleteFav = $('#fav-remove');

$('#fav-create').click((e) => {
    if ($fav_dialog == undefined) {
        $fav_dialog = $(template('./template/create-dialog.html', {
            title: "Create Favorite",
            btn1: "Create"
        }));
        var $nameBox = $fav_dialog.find('#name');
        $('.content').prepend($fav_dialog);
        $fav_dialog.find('#create').click(() => {
            if ($nameBox.val() > 3);
            db.FavoriteFile.create({
                Name: $nameBox.val()
            }).then(fav => {
                CurrentFav = fav;
                $selFav.prepend($(`<option value="${fav.Id}" selected>${fav.Name}</option>"`));
                config.favId = fav.Id;
                loadFavFiles();
                hideCreateFav($fav_dialog);
            });
        });
        $fav_dialog.find('#close').click(() => { hideCreateFav($fav_dialog) });
        $fav_dialog.css({
            zIndex: 999,
            minHeight: 150,
            height: 150,
            width: 300,
            left: $list_modal.offset().left,
            top: e.clientY - 177
        });

        $fav_dialog.fadeIn('slow', () => {
            $nameBox.focus();
        });
    }
});

$deleteFav.click((e) => {
    var id = $selFav.val();
    db.FavoriteFile.destroy({
        where: {
            Id: id
        }
    }).then((fav) => {
        if (fav > 0) {
            $selFav[0].remove($selFav[0].selectedIndex);
            if ($selFav.children().length > 0) {
                config.favId = $selFav.val();

            } else {
                config.favId = 1;
                db.db.query("DELETE FROM sqlite_sequence WHERE name = 'favoritefiles';").catch(err => {
                    console.log(err);
                });
            }
        }
        loadFavFiles();
    });
});
hideCreateFav = function () {
    if ($fav_dialog !== undefined) {
        $fav_dialog.fadeOut('fast', () => {
            $fav_dialog.remove();
            $fav_dialog = undefined;
        });
    }
};

$selFav.change(e => {
    config.favId = $selFav.val();
    loadFav();
});

loadFav = function () {
    if ($selFav.children().length == 0) {
        db.FavoriteFile.findAll().then(favs => {
            for (var f of favs) {
                var selected = '';
                if (f.Id == config.favId) {
                    selected = "selected";
                    if (config.favId == 1) {
                        $deleteFav.addClass("d-none");
                    }
                }
                $selFav.append(`<option value="${f.Id}" ${selected}>${f.Name}</option>"`)
            }
            loadFavFiles();
        });
    } else
        loadFavFiles();
}

loadFavFiles = async () => {
    var files = [];
    var isFile = true;
    if (config.favId == 1) {
        files = await db.Folder.findAll({
            where: {
                favoritefileId: 1
            }
        });
        isFile = false;
        $deleteFav.addClass("d-none");
    } else {
        files = await db.File.findAll({
            where: {
                favoritefileId: config.favId
            }
        });
        $deleteFav.removeClass("d-none");
    }
    $('#fav-found').text(files.length ? files.length : "");
    loadList('list-favs', files, isFile);
}

removeFavFromList = async (event) => {

    var li = event.target.closest('li');
    var id = li.id.replace("file-", "");
    var f;
    console.log(id)
    if ($(li).data('isfile')) {
        f = await db.File.findOne({
            where: {
                Id: id
            }
        });
    } else {
        f = await db.Folder.findOne({
            where: {
                Id: id
            }
        });
    }
    f.updateAttributes({
        favoritefileId: null
    }).then(() => {
        $(li).fadeOut('fast', () => {
            $(li).remove();
            var t = $('#fav-found').text();
            $('#fav-found').text(t - 1);
        });
    });
}

$('.list-file-content').on('click', '#list-favs #delete-list', removeFavFromList);