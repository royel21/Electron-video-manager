

setfullscreen = () => {
    if (!document.webkitIsFullScreen) {
        document.body.webkitRequestFullscreen();
        mainWindow.setResizable(false);
    } else {
        document.webkitCancelFullScreen();
        mainWindow.setResizable(true);
    }
}

player.ondblclick = (e) => {
    setfullscreen();
}

// var vthumb = document.getElementById('v-seek-thumb');
// var isMoving = false;
// var xpos = 0;
// vseeker.onmousedown = (e) => {
//     xpos = e.pageX - vseeker.offsetLeft;
//     isMoving = true;
//     console.log(xpos);
// }

// $('body').mouseup((e) => {
//     isMoving = false;
// });

// vseeker.onclick = (e) => {
//     var newPos = e.pageX - vseeker.offsetLeft - 12.5;
//     vthumb.style.left = newPos + "px";
// }

// $('body').mousemove((e) => {
//     var newPos = e.pageX - vseeker.offsetLeft - 12.5;
//     if (isMoving && newPos > 0 && newPos < vseeker.offsetWidth - 16) {
//         vthumb.style.left = newPos + "px";
//         var value = newPos.map(0, vseeker.offsetWidth - 16, 0, player.duration);
//         console.log(Math.floor(value))
//     }
// });