var animateDiv1 = document.getElementById("animate-image-1");
var animateDiv2 = document.getElementById("animate-image-2");
updatePageNum = () => {
    tempImg.src = "";
    if(currentFile !== undefined)
    imageSlider.value = currentFile.Current;
    LoadNextImage = true;
    $filescount.text('Files: ' + (fileN + 1) + '/' + filesList.length);
    $('.pages').text(String(currentFile.Current + 1).padStart(totalPage > 99 ? 3 : 2, '0') + "/" + totalPage);
    $("#img-viewer")[0].scrollTo(0, 0);

}

noneAnimation = () => {
    viewerImg.src = tempImg.src;
    updatePageNum();
}

slideAnimation = () => {
    $(animateDiv1).animate({ left: direction ? -window.innerWidth + "px" : +window.innerWidth + "px" }, {
        duration: Number(config.animDuration),
        always: function () {
            animateDiv1.style.left = 0;
        }
    });
    animateDiv2.style.left = direction ? window.innerWidth + "px" : -window.innerWidth + "px";
    animateDiv2.style.display = "flex";
    $(animateDiv2).animate({ left: 0 }, {
        duration: Number(config.animDuration),
        always: function () {
            animateDiv2.style.display = "none";
            viewerImg.src = tempImg.src;
            updatePageNum();
        }
    });
}

pgAnimation = {
    None: noneAnimation,
    Slide: slideAnimation
}
