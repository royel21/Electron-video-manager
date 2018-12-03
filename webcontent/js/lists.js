var listofFile = []
var $list_modal = $('#modal-list-file');
var zIndex = 8;


$('.list-file-show').click((event) => {
    if ($list_modal[0].style.display != "flex") {
        loadRecent();
        $('.list-file-content').css({ height: $('#modal-list-file').height() - 95 });
        $list_modal.fadeIn('slow', () => {
            $list_modal.css({ display: 'flex', zIndex: zIndex++ });
        });
    }
});

$('#list-file-hide').click(() => {
    $list_modal.fadeOut('fast');
    $list_modal.css({ zIndex: zIndex-- });
});

$list_modal.on('dblclick', '#delete-list', (event) => {
    event.stopPropagation();
    event.preventDefault();
});

$list_modal.on('dblclick', 'ul li', (event) => {

    var li = event.target.closest('li');
    var id = li.id.replace("file-", "");
    filesList = listofFile;
    loadZip("", id);
});

function loadList(listName, list) {
    var $the_ul = $(listName);
    var $new_ul = $the_ul.empty().clone();
    $new_ul.append(`<li class="list-item-empty list-group-item">Not Files Found</li>`);
    for (let value of list) {
        // $new_ul.append(template('./template/list-row.html',
        //     { id: value.Id, name: value.Name, size: FormattBytes(value.Size) }));
        $new_ul.append(`<li id="file-${value.Id}" class="list-group-item popup-msg" data-title="${value.Name}">
            <span id="delete-list"><i class="fas fa-trash-alt fa-1x"></i></span>
            <span class="list-text">${value.Name} ${FormattBytes(value.Size)}</span>
        </li>`);
    }

    $(listName).replaceWith($new_ul);
    listofFile = list.map(f => { return f.Name; });
}

$('#list-file-header input').change(event => {
    $('#list-file-header label').removeClass('active');
    $(event.target).next().addClass('active');
    $(".tab-content").addClass('d-none');
    var listId = event.target.id.replace('tab-', '');
    $('#' + listId).removeClass('d-none');

    switch (listId) {
        case "recent": {
            $('.list-file-content').css({ height: $('#modal-list-file').height() - 95 });
            loadRecent();
            break;
        }

        case "files": {
            $('.list-file-content').css({ height: $('#modal-list-file').height() - 93 });
            loadNewPage(1);
            break;
        }

        case "favorite": {
            $('.list-file-content').css({ height: $('#modal-list-file').height() - 93 });
            loadFav();
            break;
        }
    }
});