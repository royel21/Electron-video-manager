var listofFile = []
var $list_modal = $('.modal-list-file');

$('.list-file-show').click((event) => {
    $list_modal.addClass('show-modal');
});

$('#list-file-hide').click(() => {
    $list_modal.removeClass('show-modal');
    hideCreateFav($fav_dialog);
});

$list_modal.on('dblclick', '#delete-list', consumeEvent);

$list_modal.on('click', 'ul li', (event) => {
    $(event.target).focus();
});

processRow = (event) => {
    var li = event.target.closest('li');
    var id = li.id.replace("file-", "");
    if ($(li).data('isfile')) {
        if (listofFile.length > 0) {
            var filter = compressFilter;
            if (videoFilter.includes(li.dataset.title.split('.').pop()))
                filter = videoFilter;
            filesList = listofFile.filter(f => filter.includes(f.Name.split('.').pop()));
        }
        loadList('current-list', filesList, true);
        processFile(li.dataset.title);

    } else {
        loadDirectory('', id);
        toggleView(1);
    }
}

loadCurrentList = () => {
    // var filter = compressFilter : videoFilter;
    // if (filesList.length == 0) {
    //     filesList = WinDrive.ListFiles(currentDir, currentView == 2 ? compressFilter : videoFilter)
    //         .map((vid) => { return { Name: vid.FileName } });
    // } else {
    //     filesList = listofFile.filter(f => filter.includes(f.Name.split('.').pop()));
    // }
}

$list_modal.on('dblclick', 'ul li', processRow);


function loadList(listName, list, isFile) {
    var newList = document.getElementById(listName);
    newList.innerHTML = "";
    var documentFragment = document.createDocumentFragment();
    var div = document.createElement('div');
    div.innerHTML = `<li class="list-item-empty list-group-item">Not Files Found</li>`
    documentFragment.append(div.firstElementChild);
    list.forEach(value => {
        documentFragment.append(createEntry(value, isFile));
    });
    newList.append(documentFragment);
    if (!"list-recent".includes(listName) && isFile) {
        listofFile = list.map(a => { return { Name: a.Name } });
    }
}

createEntry = (value, isFile) => {
    var listIcon = "&#xf07b";
    if (isFile) {

        var listIcon = videoFilter.includes(value.Name.toLowerCase().split('.').pop()) ? "&#xf1c8;" : "&#xf1c6;";
    }
    var div = document.createElement('div');
    div.innerHTML = `<li id="file-${value.Id}" class="list-group-item popup-msg" data-isFile="${isFile}" data-title="${value.Name}" tabindex="0">` +
        `<span id="delete-list"><i class="fas fa-trash-alt fa-1x"></i></span>` +
        `<span class="list-text"><span class="list-icon">${listIcon}</span> ${value.Name} ${FormattBytes(value.Size)}</li>`;

    return div.firstElementChild;
}

$('#list-file-header input').change(event => {
    $('#list-file-header label').removeClass('active');
    $(event.target).next().addClass('active');
    $(".tab-content").addClass('d-none');
    var listId = event.target.id.replace('tab-', '');
    $('#' + listId).removeClass('d-none');
    switch (listId) {
        case "recent":
            {
                loadRecent();
                break;
            }

        case "files":
            {
                loadNewPage(1);
                break;
            }

        case "favorite":
            {
                loadFav();
                break;
            }
        case "play-list": {
            loadList('current-list', filesList, true);
        }
    }
});


$list_modal.on('keydown', 'ul li', (event) => {
    var $row = $(event.target);
    switch (event.keyCode) {
        case 13:
            {
                processRow(event);
                break;
            }

        case 38:
            {
                if ($row.prev()[0].id == "") {
                    var $list = $row.closest('ul');
                    if ($list[0].id == "list-files" && currentPage > 1) {
                        loadNewPage(--currentPage).then(() => {
                            $('#list-files').find('li').get(1).focus();
                        });
                    }
                    $row.closest('ul').find('li').last().focus();
                } else {
                    $row.prev().focus();
                }
                break;
            }

        case 40:
            {
                if ($row.next()[0] == undefined) {
                    var $list = $row.closest('ul');
                    if ($list[0].id == "list-files" && currentPage < numberOfPages) {
                        loadNewPage(++currentPage).then(() => {
                            $('#list-files').find('li').get(1).focus();
                        });
                    }
                    $list.find('li').get(1).focus();
                } else {
                    $row.next().focus();
                }
                break;
            }
    }
});
