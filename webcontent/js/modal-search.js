
var $modalSearch = $('#modal-search');
var $searchBox = $('#modal-search-box');
var boxFilter = "";
showSearch = (e) => {

    $modalSearch.css({
        display: 'block'
    });

    $searchBox.focus();
}

$('#modal-search #btn-search').click((e) => {
    if ($searchBox.val().length > 2 || $searchBox.val().length == 0) {
        loadDirectory("");
    }
})

searchFile = (e) => {

    e.stopPropagation();
    if (![37, 38, 39, 40].includes(e.keyCode))

        if (e.keyCode === 13) {
            if ($searchBox.val().length > 2 || $searchBox.val().length == 0) {
                boxFilter = $searchBox.val().toLocaleLowerCase();
                loadDirectory("");
            }
        }

}

$searchBox.keyup(searchFile);
$searchBox.keydown((e) => { e.stopPropagation() });
$searchBox.keypress((e) => { e.stopPropagation() });

$('#close-search').click((e) => {
    $modalSearch.css({
        display: 'none'
    });
    e.stopPropagation();
    $searchBox.val("");
    boxFilter = "";
    loadDirectory("");
});
