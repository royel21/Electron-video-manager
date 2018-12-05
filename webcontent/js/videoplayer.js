var volcontrol = document.getElementById('v-vol-control');
var btnPlay = document.getElementById('v-play');
var btnMuted = document.getElementById('v-mute');
var player = document.getElementById('player');

var $vplayer = $('#video-viewer');
var $vTotalTime = $('#v-total-time');

var isPlayer = () => !$vplayer.hasClass('d-none');
var vFilter = ['mp4', 'mkv', 'avi', 'webm', 'ogg'];
var totalTime;
var videoIndex = 0;
var videos = [];
var hour = false;
var vDuration = "";

var Slider = null;

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
    if (slider) {
        Slider.setVideo("");
        Slider = null;
    }
    videos = [];
    toggleView('FileViewer');
}

$('#v-exit-to-fb').click(returnToFb);

playVideo = async (v) => {
    player.src = v.replace('#', '%23');
    $('#title').text(path.basename(v));
    player.play().catch(e => { });
    Slider.setVideo(v);
}

player.onloadedmetadata = function (e) {
    Slider.min = 0;
    Slider.max = player.duration;
    Slider.value = 0;
    hour = player.duration / 3600 < 0;
    vDuration = formatTime(0) + "/" + vDuration;
    player.volume = volcontrol.value;
    toggleView("VideoViewer");
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
    Slider.value = Math.floor(player.currentTime);
}

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
    Slider = new SliderRange();
    Slider.oninput = (value) => {
        player.currentTime = value;
    }
    var video = path.join(v.folder.Name, v.Name);
    playVideo(video);

    $(window).on('wheel', wheelScroll);
    $(document).on('mousemove', hideVideoControls);
    $(document).on('webkitfullscreenchange', hideVideoControls);
    videos = WinDrive.ListFiles(v.folder.Name, vFilter).map((vid) => {
        return path.join(basedir, vid.FileName);
    });
    videoIndex = videos.indexOf(video);
}

