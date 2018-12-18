
deleteFile = (file, showloading) => {
    return new Promise((resolve, rejected) => {
        dialog.showMessageBox(mainWindow, {
            type: 'warning',
            buttons: ['Yes', 'No'],
            message: 'Are you sure you want to delete ' + file + ' ?',
            checkboxLabel: 'Never ask me again',
            checkboxChecked: false,

        }, (resp, checkboxChecked) => {
            if (resp === 0) {
                if (fs.existsSync(file)) {
                    if (showloading) $('#loadingDiv').removeClass('d-none');
                    fs.removeSync(file);
                    var cover = path.join("./covers", path.basename(file) + ".jpg");
                    if (fs.existsSync(cover)) fs.removeSync(cover);
                    if (showloading) $('#loadingDiv').addClass('d-none');
                }
            }
            resolve(resp);
        });
    });
}


selectItem = async (index) => {
    selectedIndex = index;
    var nextEl = $('.items').get(index);
    var tout = setTimeout(() => {
        if (nextEl != undefined) {
            var scroll = contentScroll.scrollTop, elofft = nextEl.offsetTop;

            if (elofft - scroll + 1 < -1) {
                scroll = elofft;
            }

            var top = elofft + nextEl.offsetHeight;
            var sctop = scroll + contentScroll.offsetHeight;
            if (top - sctop + 1 > 0) {
                scroll = scroll + (top - sctop);
            }
            contentScroll.scroll({
                top: scroll,
                behavior: 'auto'
            });
            $(nextEl).focus();
        }
        clearTimeout(tout);
    });
    return nextEl;
};


itemClick = (event) => {
    $cmenu.css({
        display: "none"
    });
    var $item = $(event.target).closest('.items');
    if ($item.get(0) != undefined) {
        var index = $('.items').index($item);
        switch (event.target.classList[0]) {
            case 'item-del':
                {
                    deleteFile(path.join(currentDir, $item.data('name')), true)
                        .then(resp => {
                            if (resp == 0) {
                                $item.fadeOut('slow', () => {
                                    $item.remove();
                                });
                            }
                        });
                    break;
                }
            case 'item-fav':
                {
                    addToFav($item, event);
                    break;
                }
        }

        if (totalitem !== 0) {
            selectItem(index);
        }
        event.stopPropagation();
        event.preventDefault();
    }
}

addToFav = async ($item, event) => {

    var name = $item.data('name');
    var isFile = $item.data('isfile');

    if (isFile && config.favId == 1) return;
    var f;
    try {
        f = await db.Folder.findOrCreate({
            where: {
                Name: path.join(currentDir, name)
            }
        });

        if (isFile) {
            // files can't be without parent folder;
            if (folderId == null)
                folderId = (await db.Folder.Create({ Name: currentDir })).Id;

            f = await db.File.findOrCreate({
                where: {
                    Name: name
                }
            });
        }

        var $star = $('.items:textequalto(' + name + ')').find('.fa-star');
        if (!favs.includes(name)) {

            if (!isFile) {
                f[0].updateAttributes({
                    folderId: folderId,
                    favoritefileId: 1
                });
            } else {
                var file = WinDrive.ListFiles(path.join(currentDir, name), true)[0];
                f[0].updateAttributes({
                    Current: 0,
                    Size: file.Size,
                    folderId: folderId,
                    favoritefileId: config.favId
                });
            }
            $star.removeClass('far').addClass('in-fav fas');
            $('#list-favs').append(createEntry(f[0], isFile));
            favs.push(name);
        } else {
            f[0].updateAttributes({
                favoritefileId: null
            });
            $('#list-favs').find('#file-' + f[0].Id).remove();
            $star.removeClass('in-fav fas').addClass('far');
            var i = favs.indexOf(name);
            favs.splice(i, 1);
        }
    } catch (err) {
        console.log(err);
    }
}

function CreateEl(file, diskIcon) {
    var isFile = !file.isDirectory;
    var img = diskIcon === undefined ? isFile ? zipIcon : folderIcon : diskIcon;
    var isImage = false;
    var isVideo = false;
    if (isFile) {
        var ex = file.extension.toLocaleLowerCase();
        if (imagesFilter.includes(ex)) {
            isImage = true;
            img = path.join(currentDir, file.FileName).replace('#', '%23');
        } else if (videoFilter.includes(ex)) {
            img = videoIcon;
            isVideo = true;
        }
    }

    var fav = favs.find(f => f.Name === file.FileName);
    var isFav;
    var current, total;
    var page = "";
    var pageCLass = "";
    if (fav != undefined) {
        isFav = fav.isFav ? "in-fav fas" : "far";
        if (isFile && fav.Page > 0) {
            current = fav.Page, total = fav.Total;
            pageCLass = (current + 1) >= total ? "bg-primary" : "bg-danger";
            if (isVideo) {
                current = formatTime(current);
                total = formatTime(total);
            }else{
                current = fav.Page+1;
            }
            page = `${current}/${total}`
        }
    } else {
        isFav = "far";
    }


    var div = document.createElement('div');
    div.innerHTML =
        `<div data-isfile="${isFile}" data-name="${file.FileName}" tabindex="0" data-size="${file.Size}" data-mdate="${file.LastModified}" data-ex="${file.extension}" class="items" >
                <div class="item-file popup-msg" >
                    <div class="item-btns">
                        <span class="item-del fas fa-trash"></span>
                        <span class="item-fav ${isFav} fa-star ${isImage ? "d-none" : ""}"></span>
                    </div>
                    <div class="item-cover"><span><img draggable="false" data-src="${img}" src=""/></span></div>
                    <div class="item-name">${file.FileName}</div>
                    <span class="file-page ${pageCLass}"
                        data-pages="${page}"></span>
                </div>
            </div>`;
    return div.firstElementChild;
}

loadFavs = async () => {
    var fos = await db.Folder.findAll({ where: { folderId: folderId } });
    var fis = await db.File.findAll({ where: { folderId: folderId } });
    favs = fos.concat(fis).map(f => {
        var isFav = f.favoritefileId !== null;
        var Name = f.Name.length < 4 ? f.Name : path.basename(f.Name);
        return { Name, Page: f.Current, isFav, Total: f.Total }
    });
}

lazyLoad = () => {
    var lazyCovers = document.querySelectorAll('.items');
    var lazyImageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            let lazyCover = entry.target.querySelector('img');
            if (entry.isIntersecting) {

                var ds = entry.target.dataset;
                var icon;
                if (lazyCover.dataset.src == videoIcon || lazyCover.dataset.src === zipIcon) {
                    var isVideo = videoFilter.includes(ds.ex);
                    icon = './covers/' + (isVideo ? 'videos/' + ds.name + '-0.png' : ds.name + '.jpg');
                    if (fs.existsSync(icon)) {
                        lazyCover.dataset.src = icon.replace('#', '%23');
                    }
                }

                lazyCover.src = lazyCover.dataset.src;
            } else {
                lazyCover.src = "";
            }
        });
    }, {
            rootMargin: "384px 0px 384px 0px"
        });

    lazyCovers.forEach((lazyImg) => {
        lazyImageObserver.observe(lazyImg);
    });
}