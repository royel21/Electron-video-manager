updatePageNum = () => {
    tempImg.src = "";
    if(currentFile !== undefined)
    imageSlider.value = currentFile.Current;
    LoadNextImage = true;
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
