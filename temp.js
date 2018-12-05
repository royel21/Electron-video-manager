var volcontrol = document.getElementById('v-vol-control');
var vseeker = document.getElementById('v-seek');
var btnPlay = document.getElementById('v-play');
var btnMuted = document.getElementById('v-mute');
var player = document.getElementById('player');

var $vplayer = $('#video-viewer');
var $vTotalTime = $('#v-total-time');

var isPlayer = () => !$vplayer.hasClass('d-none');
var vFilter = ['mp4', 'mkv', 'avi', 'webm', 'ogg'];
var totalTime;
// player.setAttribute("controls", "controls")
var videoIndex = 0;
var videos = [];
var hour = false;
var vDuration = "";

formatTime = (time) => {
    var h = Math.floor(time / 3600);
    var m = Math.floor((time / 3600 - h) * 60);
    var s = Math.floor(time % 60);
    return (h == 0 ? "" : String(h).padStart(2, "0") + ':') +
        String(m).padStart(2, "0") + ':' + String(s).padStart(2, "0");
}

$('#v-next').click(() => {
    if (videoIndex < videos.length - 1) {
        playVideo(videos[++videoIndex]);
    }
});

$('#v-prev').click(() => {
    if (videoIndex > 0) {
        playVideo(videos[--videoIndex]);
    }
});


returnToFb = () => {
    player.src = "";
    $(window).off('wheel', wheelScroll);
    $(document).off('mousemove', hideVideoControls);
    $(document).off('webkitfullscreenchange', hideVideoControls);
    $(window).off('resize', ajustSeekerPos);
    videos = [];
    toggleView('FileViewer');
}

$('#v-exit-to-fb').click(returnToFb);

playVideo = async (v) => {
    player.src = v.replace('#', '%23');
    $('#title').text(path.basename(v));
    player.play().catch(e => { });
}

ajustSeekerPos = () => {
    var v = formatTime(player.currentTime);

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
            marginLeft: hour ? newPoint.map(0.0, 1.0, 11, -10) : newPoint.map(0.0, 1.0, 26, 2)
        }).text(v);
    $vTotalTime.text(v + "/" + formatTime(player.duration));
}


player.onloadedmetadata = function (e) {
    vseeker.min = 0.0;
    vseeker.max = player.duration;
    vseeker.value = 0.0;
    hour = player.duration/3600 < 0;
    vDuration = formatTime(0) + "/" + vDuration;
    player.volume = volcontrol.value;
    ajustSeekerPos();
    toggleView("VideoViewer");
    
}

vseeker.oninput = (e) => {
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
    ajustSeekerPos();
}
//createThumb();
//playVideo(0);
player.onended = function () {
    if (videoIndex < videos.length - 1) {
        playVideo(videos[++videoIndex]);
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
            player.currentTime -= event.ctrlKey ? 15 : 5;
            break;
        }
        case 38: {
            volcontrol.value = player.volume + (event.ctrlKey ? 0.05 : 0.01);
            player.volume = volcontrol.value;
            break;
        }
        case 39: {
            player.currentTime += event.ctrlKey ? 15 : 5;
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

player.onvolumechange = function (e) { btnMuted.checked = player.volume == 0; }

wheelScroll = (event) => {
    // deltaY obviously records vertical scroll, deltaX and deltaZ exist too
    if (isPlayer()) {
        if (event.originalEvent.deltaY < 0) {
            volcontrol.value = player.volume + 0.05;
            player.volume = volcontrol.value;
        }
        else {
            volcontrol.value -= 0.05;
            player.volume = volcontrol.value;
        }
    }
};

initPlayer = (v) => {
    var video = path.join(v.folder.Name, v.Name);
    playVideo(video);

    $(window).on('wheel', wheelScroll);
    $(document).on('mousemove', hideVideoControls);
    $(document).on('webkitfullscreenchange', hideVideoControls);
    $(window).on('resize', ajustSeekerPos);

    videos = WinDrive.ListFiles(basedir, vFilter).map((video) => {
        return path.join(basedir, video.FileName);
    });
    videoIndex = videos.indexOf(video);
}

