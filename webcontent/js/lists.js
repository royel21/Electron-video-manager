var listofFile = []
var $list_modal = $('.modal-list-file');

$('.list-file-show').click((e) => {
    $list_modal.addClass('show-modal');
    selectList($('#' + (currentView == 1 ? 'tab-recent' : "tab-play-list"))[0]);
    positionModal(e, $list_modal);
});

$('#list-file-hide').click((e) => {
    $list_modal.removeClass('show-modal');
    hideCreateFav($fav_dialog);
    consumeEvent(e);
});

selectListRow = (el, isCtrl) =>{ 
    if (!isCtrl) {
        $(el.closest('ul')).find("li").removeClass('el-selected');
    }
    $(el).addClass('el-selected');
    el.focus();
}

$('.list-file-content').on('dblclick', '#delete-list', consumeEvent);
$('.list-file-content').on('click', 'ul li', (e)=>{ selectListRow(e.target, e.ctrlKey)});

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
        listofFile = list.map(a => {
            return {
                Name: a.Name
            }
        });
    }
    if (listName.includes('current')) {
        $('#file-count').text(listofFile.length);
    }
}

createEntry = (value, isFile) => {
    var listIcon = "&#xf07b";
    if (isFile) {

        var listIcon = videoFilter.includes(value.Name.toLowerCase().split('.').pop()) ? "&#xf03d;" : "&#xf1c6;";
    }
    var div = document.createElement('div');
    div.innerHTML = `<li id="file-${value.Id}" class="list-group-item popup-msg" data-isFile="${isFile}" data-title="${value.Name}" tabindex="0">` +
        `<span id="delete-list"><i class="fas fa-trash-alt fa-1x"></i></span>` +
        `<span class="list-text"><span class="list-icon">${listIcon}</span> ${value.Name} ${FormattBytes(value.Size)}</li>`;

    return div.firstElementChild;
}

$('#list-file-header input').change(event => {
    selectList(event.target);
});


selectList = (target) => {
    $('#list-file-header label').removeClass('active');
    $(".tab-content").addClass('d-none');
    $(target).next().addClass('active');
    var listId = target.id.replace('tab-', '');
    var $list = $('#' + listId);
    $list.removeClass('d-none');
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
        case "play-list":
            {
                if (currentView > 1 && $('#' + listId).find('li').length < 2) {
                    loadList('current-list', filesList, true);
                }
            }
    }
    if (currentFile && listId.includes('play')) {
        var el = $list.find('li[data-title*="' + currentFile.Name.split(" ").pop() + '"]')[0];
        el.scrollIntoView();
        selectListRow(el, false);
    }
}

$('.list-file-content').on('keydown', 'li', (event) => {
    var $row = $(event.target);
    var $list = $row.closest('ul');
    switch (event.keyCode) {
        case 13:
            {
                processRow(event);
                break;
            }

        case 38:
            {
                if ($row.prev()[0].id == "") {
                    if ($list[0].id == "list-files" && currentPage > 1) {
                        loadNewPage(--currentPage).then(() => {
                            selectListRow($('#list-files').find('li').get(1), event.ctrlKey);
                        });
                    }
                    selectListRow($row.closest('ul').find('li').last()[0], event.ctrlKey);
                } else {
                    selectListRow($row.prev()[0], event.ctrlKey);
                }
                event.preventDefault();
                break;
            }

        case 40:
            {
                if ($row.next()[0] == undefined) {
                    if ($list[0].id == "list-files" && currentPage < numberOfPages) {
                        loadNewPage(++currentPage).then(() => {
                            selectListRow($('#list-files').find('li').get(1), event.ctrlKey);
                        });
                    }
                    selectListRow($list.find('li').get(1), event.ctrlKey);
                } else {
                    selectListRow($row.next()[0], event.ctrlKey);
                }
                event.preventDefault();
                break;
            }
    }
});

$('.tool-config .sub-tools').click((e) => {
    $('.tool-config input').prop("checked", false);
})