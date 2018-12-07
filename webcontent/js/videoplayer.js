var volcontrol = document.getElementById('v-vol-control');
var btnPlay = document.getElementById('v-play');
var btnMuted = document.getElementById('v-mute');
var player = document.getElementById('player');
var vpreview = $('<video>')[0];
var $vTotalTime = $('#v-total-time');

var isPlayer = () => currentView == 3;
var totalTime;
var videoIndex = 0;
var videos = [];
var hour = false;
var vDuration = "";
var Slider = null;
var muted = false;
var playerConfig = { volume: 0, isMuted: false, hideCtrSecond: 1 };

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
    $(document).off('keydown', playerKeyHandler);
    if (Slider) {
        Slider.cleanUp();
        Slider = null;
    }
    videos = [];
    toggleView(1);
    local.setObject('video-player-config', playerConfig);
}

$('#v-exit-to-fb').click(returnToFb);

playVideo = async (v) => {
    player.src = v.replace('#', '%23');
    $('#title').text(path.basename(v));
    player.play().catch(e => { });
    vpreview.src = v;
}

player.onloadedmetadata = function (e) {
    Slider.min = 0;
    Slider.max = player.duration;
    Slider.value = 0;
    hour = player.duration / 3600 < 0;
    vDuration = formatTime(player.duration);
    $vTotalTime.text(formatTime(0) + "/" + vDuration);
    player.volume = playerConfig.volume;
    volcontrol.value = playerConfig.volume;
    player.muted = playerConfig.isMuted;
    btnMuted.checked = playerConfig.isMuted;
    toggleView(3);
}

$(player).dblclick((e) => {
    setfullscreen();
});

player.ontimeupdate = (e) => {
    if (Slider) Slider.value = Math.floor(player.currentTime);
    $vTotalTime.text(formatTime(player.currentTime) + "/" + vDuration)
}

player.onended = function () {
    if (videoIndex < videos.length - 1) {
        playVideo(videos[++videoIndex]);
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
            muted = false;
            player.volume = volcontrol.value;
            break;
        }
        case 39: {
            player.currentTime += event.ctrlKey ? 15 : 5;
            break;
        }
        case 40: {
            volcontrol.value -= Number(event.ctrlKey ? 0.05 : 0.01);
            muted = false;
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
        hideFooter();
    }
});

volcontrol.oninput = (e) => {
    muted = false;
    player.volume = volcontrol.value;
}

btnPlay.onchange = () => btnPlay.checked ? player.play() : player.pause();

btnMuted.onchange = () => {
    muted = true;
    playerConfig.isMuted = btnMuted.checked;
    player.muted = btnMuted.checked ? true : false;
}
player.onvolumechange = function (e) {
    if (!muted) {
        player.muted = btnMuted.checked = (player.volume == 0);
        playerConfig.volume = player.volume;

    }
}

wheelScroll = (event) => {
    // deltaY obviously records vertical scroll, deltaX and deltaZ exist too
    if (isPlayer()) {
        muted = false;
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


addRecentVideo = (video) => {
    playerConfig.recentVideo.find(v=> v.Name === video.Name)
}

initPlayer = (v) => {

    Slider = new SliderRange('#slider-container');
    Slider.oninput = (value) => {
        player.currentTime = value;
    }

    Slider.onPreview = (val)=>{
        vpreview.currentTime = val;
        Slider.setPreviewTitle(formatTime(val));
    }

    Slider.setPreviewContent(vpreview);

    var video = path.join(v.folder.Name, v.Name);

    $(window).on('wheel', wheelScroll);
    videos = WinDrive.ListFiles(v.folder.Name, videoFilter).map((vid) => {
        return path.join(v.folder.Name, vid.FileName);
    });
    videoIndex = videos.indexOf(video);

    if (local.hasObject('playerconfig')) {
        playerConfig = local.getObject('playerconfig');
    }

    $(document).on('keydown', playerKeyHandler);
    playVideo(video);
}
