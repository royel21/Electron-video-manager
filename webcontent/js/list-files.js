var pageList = new Array();
var currentPage = 1;
var numberPerPage = 500;
var numberOfPages = 0;
var totalFiles = 0;


/**************************************/

loadNewPage = (page) => {
    var val = $('#files-filter').val().toLowerCase();
    var begin = ((page - 1) * numberPerPage);
    db.VideoFile.findAndCount({
        order: ['Name'],
        offset: begin,
        limit: numberPerPage,
        where: {
            Name: {
                [db.Op.like]: "%" + val + "%"
            }
        }
    }).then(files => {
        loadList('#list-files', files.rows);
        numberOfPages = Math.ceil(files.count / numberPerPage);
        $('#file-found').html(files.count);
        $('#current-page').text((numberOfPages < 1 ? 0 : currentPage) + '/' + numberOfPages);
    });
}

$('#prev-list-page').click((e) => {
    if (currentPage > 1) {
        loadNewPage(--currentPage);
    }
});

$('#next-list-page').click((e) => {
    if (currentPage < numberOfPages) {
        loadNewPage(++currentPage);
    }
});


$('#files-filter').keyup((e) => {

    e.stopPropagation();
    if ([37, 38, 39, 40].indexOf(e.keyCode) == -1)
    {
        loadNewPage(1);
    }
});

$('#files-filter').keydown((event) => {
    event.stopPropagation();
});

$('#current-page').on('click', function () {

    if (numberOfPages !== 1) {
        this.textContent = "";
        var $input = $(`<input type="number" value=${currentPage}
                         style="width:70px; padding:0; font-size:15px; color: black;" min=1 
                         max=${numberOfPages}>`)
            .appendTo($(this)).focus();

        $input.click((event) => {
            event.stopPropagation();
            event.preventDefault();
        });
        $input.on('focusout', (e) => {
            $('#current-page').text(currentPage + '/' + numberOfPages);
        });
        $input.on('keyup', (event) => {
            if (event.keyCode === 13) {
                currentPage = parseInt($input.val());

                if (currentPage > numberOfPages) {
                    currentPage = numberOfPages;
                }
                $input = null;
                loadNewPage(currentPage);
            }
            event.stopPropagation();
        });
        $input.on('keydown', (event) => {
            event.stopPropagation();
        });
        $input.focus();
    }
});

$('.list-file-content').on('click', '#list-files #delete-list', (event) => {
    var li = event.target.closest('li');
    var id = li.id.replace("file-", "");
    db.VideoFile.findOne({
        where: {
            id: id
        },
        include: {
            model: db.Folder
        }
    }).then(f => {
        if (f != null) {
            var file = path.join(f.folder.Name, f.Name);
            deleteFile(file, false).then(resp => {
                if (resp == 0) {
                    removeRow(li, id);
                }
            });
        } else {
            removeRow(li, id);
        }
    });
});

$('#btn-search-clear').click(()=>{
    $('#files-filter').val("");
});

removeRow = (li, id) => {
    $(li).fadeOut('fast', () => {
        $(li).remove();
        db.VideoFile.destroy({
            where: {
                Id: id
            }
        });
    });
}