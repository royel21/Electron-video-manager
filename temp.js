var volcontrol = document.getElementById('v-vol-control');
var vseeker = document.getElementById('v-seek');
var btnPlay = document.getElementById('v-play');
var btnMuted = document.getElementById('v-mute');
var player = document.getElementById('player');
var $vplayer = $('#video-viewer');

var videoFilter = ['mp4', 'mkv', 'avi', 'webm'];

var videos = WinDrive.ListFiles(basedir).filter(v => {
    return videoFilter.indexOf(v.extension.toLowerCase()) > -1
}).sort((a, b) => {
    var a1 = a.FileName.replace(/\[|\(/ig, "0");
    var b1 = b.FileName.replace(/\[|\(/ig, "0");
    return a1.localeCompare(b1);
}).map((video) => {
    return path.join(dir, video.FileName);
});

// player.setAttribute("controls", "controls")
var videoIndex = 0;

$('#v-next').click(() => {
    if (videoIndex < videos.length - 1) {
        playVideo(++videoIndex);
    }
});

$('#v-prev').click(() => {
    if (videoIndex > 0) {
        playVideo(--videoIndex);
    }
});

playVideo = async (name) => {
    player.src = path.join(basedir, name);
    //convertVideo(v);
    $('#title').text(name);
    player.play().catch(e => { });
}


ajustSeekerPos = (pos) => {
    var v = pos;

    var h = Math.floor(v / 3600);
    var m = Math.floor((v / 3600 - h) * 60);
    var s = Math.floor(v % 60);
    videoTime = (h == 0 ? "" : String(h).padStart(2, "0") + ':') +
        String(m).padStart(2, "0") + ':' + String(s).padStart(2, "0");

    var $vseeker = $(vseeker);
    var newPoint, newPlace;
    // Cache this for efficiency

    // Measure width of range input
    width = $('#video-seeker').width();

    // Figure out placement percentage between left and right of input
    newPoint = (Math.floor(vseeker.value)) / (player.duration);

    newPlace = (width * newPoint);

    $vseeker.next()
        .css({
            left: newPlace,
            marginLeft: h > 0 ? newPoint.map(0.0, 1.0, 11, -10) : newPoint.map(0.0, 1.0, 26, 2)
        }).text(videoTime);
}


player.onloadedmetadata = function (e) {
    vseeker.min = 0.0;
    vseeker.max = player.duration;
    vseeker.value = 0.0;
    ajustSeekerPos(player.currentTime);
    toggleView("VideoViewer");
    player.volume = volcontrol.value;
}

vseeker.oninput = (e) => {
    //ajustSeekerPos();
    player.currentTime = e.target.value;
}

volcontrol.oninput = (e) => {
    player.volume = volcontrol.value;
}

btnPlay.onchange = () => btnPlay.checked ? player.play() : player.pause();
btnMuted.onchange = () => player.muted = btnMuted.checked;

$(player).dblclick((e) => {
    setfullscreen();
});

player.ontimeupdate = (e) => {
    vseeker.value = Math.floor(player.currentTime);
    ajustSeekerPos(player.currentTime);
}
//createThumb();
//playVideo(0);
player.onended = function () {
    if (videoIndex < videos.length - 1) {
        playVideo(++index);
    }
}

var mouseTimer = null, cursorVisible = true;
hideVideoControls = () => {
    if (document.webkitIsFullScreen) {
        $('.v-controls').removeClass('hide-vcontrols');
        if (mouseTimer) {
            window.clearTimeout(mouseTimer);
        }
        if (!cursorVisible) {
            $vplayer.css({ cursor: "default" });
            cursorVisible = true;
        }

        mouseTimer = window.setTimeout(() => {
            mouseTimer = null;
            if (!player.paused && document.webkitIsFullScreen) {
                $vplayer.css({ cursor: "none" });
                cursorVisible = false;
                $('.v-controls').addClass('hide-vcontrols');
            }
        }, 1000);
    }
}

$('body').mousemove(hideVideoControls);
$(document).on('webkitfullscreenchange', hideVideoControls);

playerKeyHandler = (e) => {
    console.log(e.keyCode)
    switch (e.keyCode) {
        case 13: {
            setfullscreen();
            break;
        }
        case 32: {
            player.paused ? player.play() : player.pause();
            break;
        }
        case 37: {
            player.currentTime -= event.ctrlKey ? 5 : 1;
            break;
        }
        case 38: {
            volcontrol.value = player.volume + (event.ctrlKey ? 0.05 : 0.01);
            player.volume = volcontrol.value;
            break;
        }
        case 39: {
            player.currentTime += event.ctrlKey ? 5 : 1;
            break;
        }
        case 40: {
            volcontrol.value -= Number(event.ctrlKey ? 0.05 : 0.01);
            player.volume = volcontrol.value;
            break;
        }
    }
}

$(player).click((e) => {
    if (e.which == 1) {
        if (player.paused) {
            player.play();
        } else {
            player.pause();
        }
        btnPlay.checked = !player.paused;
        hideVideoControls();
    }
});

player.onvolumechange = function (e) {
    btnMuted.checked = player.volume == 0;
}

$(window).on('wheel', function (event) {

    // deltaY obviously records vertical scroll, deltaX and deltaZ exist too
    if (!$vplayer.hasClass('d-none')) {
        if (event.originalEvent.deltaY < 0) {
            volcontrol.value = player.volume + 0.05;
            player.volume = volcontrol.value;
        }
        else {
            volcontrol.value -= 0.05;
            player.volume = volcontrol.value;
        }
    }
});