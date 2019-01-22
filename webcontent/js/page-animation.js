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
    tempImg.style.left = direction ? window.innerWidth + "px" : -window.innerWidth + "px";
    tempImg.style.display = "block";
    $(tempImg).animate({ left: 0 }, {
        duration: Number(config.animDuration),
        always: function () {
            tempImg.style.display = "none";
            viewerImg.src = tempImg.src;
            updatePageNum();
        }
    });
}

pgAnimation = {
    None: noneAnimation,
    Slide: slideAnimation
}
