
// var curIndex = 0;
// var $itemsFound = [];
// var $fileFound = $('#search-found');
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
            // var search = $searchBox.val();
            // if (search.length > 2) {
            //     $itemsFound = $('.items:contains(' + search + ')');
            //     var index = $('.items').index($itemsFound[0]);
            //     selectItem(index);
            //     curIndex = 0;
            //     $fileFound.text((curIndex + 1) + '/' + $itemsFound.length);
            // } else {
            //     $itemsFound = [];
            //     curIndex = 0;
            // }\
            // var count = 0;
            // $('.items').each(function(index,el){
            //     var item = $(el).find(':contains('+search+')')[0];
            //     if(item != undefined){
            //         $(el).css({display: "block"});
            //         $(el).attr("tabindex", 0);
            //         count++;
            //     }else{
            //         $(el).css({display: "none"}); 
            //         $(el).removeAttr("tabindex");
            //     }
            // });
            // $filescount.text('Files: ' + count);
            if ($searchBox.val().length > 2 || $searchBox.val().length == 0) {
                boxFilter = $searchBox.val().toLocaleLowerCase();
                loadDirectory("");
            }
        }

}

$searchBox.keyup(searchFile);
$searchBox.keydown((e) => { e.stopPropagation() });
$searchBox.keypress((e) => { e.stopPropagation() });

// $('#next-item-found').click((e) => {
//     if ($itemsFound.length === 0) {
//         consumeClick(e);
//         return;
//     }
//     if (curIndex < $itemsFound.length - 1) {
//         var index = $('.items').index($itemsFound[++curIndex]);
//         selectItem(index);
//     } else {
//         curIndex = 0;
//         var index = $('.items').index($itemsFound[0]);
//         selectItem(index);
//     }
//     $fileFound.text((curIndex + 1) + '/' + $itemsFound.length);
//     consumeClick(e);
// });

// $('#prev-item-found').click((e) => {
//     if ($itemsFound.length === 0) {
//         consumeClick(e);
//         return;
//     }
//     if (curIndex > 0) {
//         var index = $('.items').index($itemsFound[--curIndex]);
//         selectItem(index);
//     } else {
//         curIndex = $itemsFound.length - 1;
//         var index = $('.items').index($itemsFound[curIndex]);
//         selectItem(index);
//     }
//     $fileFound.text((curIndex + 1) + '/' + $itemsFound.length);
//     consumeClick(e);
// });

$('#close-search').click((e) => {
    $modalSearch.css({
        display: 'none'
    });
    e.stopPropagation();
    $searchBox.val("");
    boxFilter = "";
    loadDirectory("");
});
