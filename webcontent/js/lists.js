var listofFile = []
var $list_modal = $('#modal-list-file');


$list_modal.keydown((e) => {
    e.stopPropagation()
});
$list_modal.keypress((e) => {
    e.stopPropagation()
});

$('.list-file-show').click((event) => {
    if ($list_modal[0].style.display != "flex") {
        loadRecent();
        $list_modal.fadeIn('slow', () => {
            $list_modal.css({
                display: 'flex'
            });
        });
    }
});

$('#list-file-hide').click(() => {
    $list_modal.fadeOut('fast');
    hideCreateFav($fav_dialog);
});

$list_modal.on('dblclick', '#delete-list', (event) => {
    event.stopPropagation();
    event.preventDefault();
});

$list_modal.on('click', 'ul li', (event) => {
    $(event.target).focus();
});

processRow = (event) => {
    var li = event.target.closest('li');
    var id = li.id.replace("file-", "");
    var ul_id = li.closest('ul').id
    if ($(li).data('isfile')) {
        if (ul_id != "list-recent") filesList = listofFile;
        processFile(li.dataset.title);
    } else {
        loadDirectory('', id);
        toggleView(1);
    }
}

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
    event.stopPropagation();
    event.preventDefault();
});

$list_modal.on('dblclick', 'ul li', processRow);

createEntry = (value, isFile) => {
    var div = document.createElement('div');
    div.innerHTML = `<li id="file-${value.Id}" class="list-group-item popup-msg" data-isFile="${isFile}" data-title="${value.Name}" tabindex="0">` +
        `<span id="delete-list"><i class="fas fa-trash-alt fa-1x"></i></span>` +
        `<span class="list-text">${value.Name} ${FormattBytes(value.Size)}</span></li>`;

    return div.firstElementChild;
}

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
    listofFile = list.map(f => {
        return f.Name;
    });
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
    }
});