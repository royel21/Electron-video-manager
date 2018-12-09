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

var playerConfig = {
    volume: 0,
    isMuted: false,
    paused: true,
    hideCtrSecond: 1,
    recents: []
};
var recentVideos = playerConfig.recents;

var currentVideo;

updateRecentVideos = () => {
    var tempV = recentVideos.removeByName(currentVideo);
    if (tempV != undefined) currentVideo = tempV;
    recentVideos.unshift(currentVideo);
    if (recentVideos.length > config.recentMax) recentVideos.pop();
}

$('#v-next').click(() => {
    if (videoIndex < videos.length - 1) {
        processFile(videos[++videoIndex]);
    }
});

$('#v-prev').click(() => {
    if (videoIndex > 0) {
        processFile(videos[--videoIndex]);
    }
});

returnToFb = () => {
    updateFile(currentVideo);
    updateItemProgress(currentVideo);
    $(window).off('wheel', wheelScroll);
    $(document).off('keydown', playerKeyHandler);

    if (Slider) {
        Slider.cleanUp();
        Slider = null;
    }
    savePlayerConfig();
    videos = [];
    player.src = "";
    toggleView(1);
}

$('#v-exit-to-fb').click(returnToFb);

playVideo = async (v) => {
    updateItemProgress(currentVideo);
    updateFile(currentVideo);
    var videoDir = v.folder.Name;
    var video = path.join(videoDir, v.Name.replace('#', '%23'))
    player.src = video;
    vpreview.src = video;

    currentVideo = {
        Id: v.Id,
        Name: v.Name,
        Current: v.Current,
        Total: 0
    };

    if (v.Current == undefined) {
        var tempFile = WinDrive.ListFiles(video, [], true)[0];
        tempFile.DirName = videoDir;
        tempFile.Total = 0;
        db.File.findOrCreateNew(tempFile).then(f => {
            if (f) currentVideo.Id = f.Id;
        });
        currentVideo.Current = 0;
    }

    player.currentTime = currentVideo.Current;
    player.play().catch(e => {});
    if (playerConfig.paused) player.pause();
    $('.title').text(v.Name);
    updateRecentVideos();
}

player.onloadedmetadata = function (e) {
    Slider.min = 0;
    Slider.max = player.duration;
    hour = player.duration / 3600 < 0;

    vDuration = formatTime(player.duration);
    $vTotalTime.text(formatTime(0) + "/" + vDuration);

    player.muted = playerConfig.isMuted;
    btnMuted.checked = playerConfig.isMuted;

    volcontrol.value = player.volume = playerConfig.volume;

    currentVideo.Total = player.duration;
}

$(player).dblclick((e) => {
    setfullscreen();
});

player.ontimeupdate = (e) => {
    if (Slider) Slider.value = Math.floor(player.currentTime);
    $vTotalTime.text(formatTime(player.currentTime) + "/" + vDuration)
    currentVideo.Current = player.currentTime;
}

player.onended = function () {
    if (videoIndex < videos.length - 1) {
        playVideo(videos[++videoIndex]);
    }
}

playerKeyHandler = (e) => {
    console.log(e.keyCode)
    switch (e.keyCode) {
        case 13:
            {
                setfullscreen();
                break;
            }
        case 32:
            {
                player.paused ? player.play() : player.pause();
                break;
            }
        case 37:
            {
                player.currentTime -= event.ctrlKey ? 15 : 5;
                break;
            }
        case 38:
            {
                volcontrol.value = player.volume + (event.ctrlKey ? 0.05 : 0.01);
                muted = false;
                player.volume = volcontrol.value;
                break;
            }
        case 39:
            {
                player.currentTime += event.ctrlKey ? 15 : 5;
                break;
            }
        case 40:
            {
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
    player.muted = btnMuted.checked ? true : false;
}

var volTimer = null;

player.onvolumechange = function (e) {
    if (!muted) {
        player.muted = btnMuted.checked = (player.volume == 0);
    }

    if ($('.footer').hasClass('hide-footer') && document.webkitIsFullScreen) {
        $('.v-vol').addClass('vol-show');

        if (volTimer) clearTimeout(volTimer);

        volTimer = setTimeout(() => {
            $('.v-vol').removeClass('vol-show');
            volTimer = null;
        }, 1000);
    }
}

wheelScroll = (event) => {
    // deltaY obviously records vertical scroll, deltaX and deltaZ exist too
    if (isPlayer()) {
        muted = false;
        if (event.originalEvent.deltaY < 0) {
            volcontrol.value = player.volume + 0.05;
            player.volume = volcontrol.value;
        } else {
            volcontrol.value -= 0.05;
            player.volume = volcontrol.value;
        }
    }
};

initPlayer = (v) => {
    if (Slider === null) {
        if (local.hasObject('playerconfig')) {
            playerConfig = local.getObject('playerconfig', playerConfig);
            console.log(playerConfig)
        }
        Slider = new SliderRange('#slider-container');
        Slider.oninput = (value) => {
            player.currentTime = value;
        }

        Slider.onPreview = (val) => {
            vpreview.currentTime = val;
            Slider.setPreviewTitle(formatTime(val));
        }

        Slider.setPreviewContent(vpreview);

        videos = WinDrive.ListFiles(v.folder.Name, videoFilter).map((vid) => {
            return vid.FileName;
        });
        videoIndex = videos.indexOf(v.Name);
        $(document).on('keydown', playerKeyHandler);
        $(window).on('wheel', wheelScroll);
        toggleView(3);
    } else {
        playerConfig.volume = player.volume;
        playerConfig.isMuted = player.muted;
        playerConfig.paused = player.paused;
        console.log(playerConfig)
    }

    playVideo(v);
}

savePlayerConfig = () => {
    if (recentVideos.length > 0) {
        playerConfig.volume = player.volume;
        playerConfig.isMuted = player.muted;
        playerConfig.paused = player.paused;
        local.setObject('playerconfig', playerConfig);
    }
    ipcRenderer.send('console-log', "playerConfig");
}