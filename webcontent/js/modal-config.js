var modalconfig;
isViewer = () => currentView === 1;

sortFileBy = (a, b) => {
    var n1 = a.FileName.toLocaleUpperCase().replace(/[\{|\[]/g, "0");
    var n2 = b.FileName.toLocaleUpperCase().replace(/[\{|\[]/g, "0");

    switch (config.sortBy) {
        case "Name-D":
            {
                return n1.localeCompare(n2);
            }
        case "Name-U":
            {
                return n2.localeCompare(n1);
            }
        case "Date-D":
            {
                return new Date(a.LastModified) - new Date(b.LastModified);
            }
        case "Date-U":
            {
                return new Date(b.LastModified) - new Date(a.LastModified);
            }
        case "Size-D":
            {
                return a.Size - b.Size;
            }
        case "Size-U":
            {
                return b.Size - a.Size;
            }
    }
}

sortBy = (a, b) => {
    if (a.dataset != undefined || b.dataset != undefined) {
        var dataA = a.dataset;
        var dataB = b.dataset;
        return sortFileBy({ FileName: dataA.name, Size: Number(dataA.size), LastModified: dataA.mdate },
            { FileName: dataB.name, Size: Number(dataB.size), LastModified: dataB.mdate });
    } else {
        return sortFileBy(a, b);
    }
}

var sortType = ["Name-D", "Name-U", "Date-D", "Date-U", "Size-D", "Size-U"];

sortElements = () => {
    var items = [].slice.call(document.getElementsByClassName('items'));
    var flist = document.getElementById('file-list');
    items.sort(sortBy);
    flist.innerHTML = "";
    var fileL = [];
    items.filter((el) => !$(el).data('isfile'))
        .concat(items.filter((el) => $(el)
            .data('isfile'))).forEach(function (p, i) {
                flist.appendChild(p);
                fileL[i] = p.dataset.name;
            });
    filesList = fileL;
    lazyLoad();
}

showConfigModal = (e) => {

    if (modalconfig == undefined) {
        modalconfig = $(template('./template/modal-config.html', { isViewer: isViewer() ? "d-none" : "", isfilebrowser: isViewer() ? "" : "d-none" }));

        $('.content').prepend(modalconfig);
        modalconfig.find('#modal-close').click(() => {
            hideModal(modalconfig);
            modalconfig = undefined;
        });
    };
    if (!isViewer()) {
        const imgWScale = document.getElementById('img-width');

        imgWScale.oninput = function () {
            config.imgScale = this.value;
            $('#img-content img').css("transform", "scaleX(" + config.imgScale + ")");
            $('#img-width-val').text(config.imgScale);
        }

        imgWScale.value = config.imgScale;
        $('#img-width-val').text(config.imgScale);
        //Animation Selection
        var $animSelect = modalconfig.find('#anim-select');
        for (var key in pgAnimation) {
            $animSelect.append($(`<option value="${key}" ${key == config.pageAnimation ? "Selected" : ""}>${key}</option>"`));
        }
        $animSelect.change(e => {
            config.pageAnimation = $animSelect.val();
        });
        /*************Animation Duration in ms***********************/
        var $animDuration = modalconfig.find('#anim-duration');
        $animDuration.val(config.animDuration);
        $animDuration.change((e) => {
            config.animDuration = e.target.value;
        });

    } else {

        var $sortSelect = modalconfig.find('#sort-select');
        
        $sortSelect.change(e => {
            config.sortBy = $sortSelect.val();
            sortElements();
        });
    }
    positionModal(e, modalconfig);
}

hideModal = function ($modal) {
    $modal.fadeOut('fast', () => {
        $modal.remove();
    });
};

positionModal = (e, $modal) => {
    var pos = $(e.target).offset();
    var m = $modal[0];
    moveEl(m, pos.left, (pos.top - m.offsetHeight - 10), $modal.width(), $modal.height());
    $modal.fadeIn('slow');
};

$('.tool-img-fb').click(showConfigModal);
