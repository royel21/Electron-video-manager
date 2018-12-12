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
var vDuration;
var Slider = null;
var update = false;

$('#v-next').click(() => {
    if (videoIndex < videos.length - 1) {
        processFile(videos[++videoIndex]);
    }else{
        returnToFb();
    }
});

$('#v-prev').click(() => {
    if (videoIndex > 0) {
        processFile(videos[--videoIndex]);
    }else{
        returnToFb();
    }
});

playerCleanUp = async () => {
    updateFile(currentFile);
    $(window).off('wheel', wheelScroll);
    $(document).off('keydown', playerKeyHandler);

    if (Slider) {
        Slider.cleanUp();
        Slider = null;
    }
    videos = [];
    player.src = "";
}
returnToFb = () => {
    playerCleanUp();
    toggleView(1);
    selectItem(updateItemProgress(currentFile));
}

$('#v-exit-to-fb').click(returnToFb);

playVideo = async (v) => {
    updateItemProgress(currentFile);
    updateFile(currentFile);
    var videoDir = v.folder.Name;
    var video = path.join(videoDir, v.Name.replace('#', '%23'));

    currentFile = {
        Id: v.Id,
        Name: v.Name,
        Current: v.Current,
        Total: 0
    };

    if (v.Current == undefined) {
        var tempFile = WinDrive.ListFiles(video, [], true)[0];
        tempFile.DirName = videoDir;
        tempFile.Total = 0;
        var f = await db.File.findOrCreateNew(tempFile)
        if (f) {
            currentFile.Id = f.Id;
            currentFile.Size = f.Size;
        }
        currentFile.Current = 0;
    }
    
    player.src = video;
    vpreview.src = video;
    player.currentTime = currentFile.Current-0.1;
    $('.title').text(v.Name);
    updateRecents();
    player.play().catch(e => {});
    if (config.paused) player.pause(); 
}

player.onloadedmetadata = function (e) {
    Slider.min = 0;
    Slider.max = player.duration;
    hour = player.duration / 3600 < 0;
    vDuration = formatTime(player.duration);
    $vTotalTime.text(formatTime(0) + "/" + vDuration);
    currentFile.Total = player.duration;
    toggleView(3);
    Slider.value = Math.floor(currentFile.Current);
    update = true;
}

$(player).dblclick((e) => {
    setfullscreen();
});

player.ontimeupdate = (e) => {
    if (update && Slider) {
        Slider.value = Math.floor(player.currentTime);
        $vTotalTime.text(formatTime(player.currentTime) + "/" + vDuration)
        currentFile.Current = player.currentTime;
    }
}

player.onended = function () {
    if (videoIndex < videos.length - 1) {
        console.log("Test");
        var waitEnd = setTimeout(()=>{
            if(player.ended)
            processFile(videos[++videoIndex]);
            clearTimeout(waitEnd);
        }, 3000)
    }else{
        returnToFb();
    }
}

playerKeyHandler = (e) => {

    switch (e.keyCode) {
        case 13:
            {
                setfullscreen();
                break;
            }
        case 32:
            {
                player.paused ? player.play().catch(e => {}) : player.pause();
                break;
            }
        case 37:
            {
                player.currentTime -= event.ctrlKey ? 12 : 6;
                break;
            }
        case 38:
            {
                volcontrol.value = player.volume + (event.ctrlKey ? 0.05 : 0.01);
                player.volume = volcontrol.value;
                break;
            }
        case 39:
            {
                player.currentTime += event.ctrlKey ? 12 : 6;
                break;
            }
        case 40:
            {
                volcontrol.value -= Number(event.ctrlKey ? 0.05 : 0.01);
                player.volume = volcontrol.value;
                break;
            }
    }
}
pauseOrPlay = () => {
    var playPause = "Play";
    if (btnPlay.checked) {
        player.play().catch(e => {});
    } else {
        player.pause();
        playPause = "Pause";
    }
    $('.fa-play-circle').attr('data-title', playPause);
    config.paused = player.paused;
}

$(player).click((e) => {
    if (e.which == 1) {
        btnPlay.checked = player.paused;
        pauseOrPlay();
    }
});

volcontrol.oninput = (e) => {
    player.volume = volcontrol.value;
}
player.onplay = player.onpause = hideFooter;


btnPlay.onchange = pauseOrPlay;

btnMuted.onchange = () => {
    player.muted = btnMuted.checked;
    config.isMuted = btnMuted.checked;
    $('.fa-volume-up').attr('data-title', btnMuted.checked ? "Unmute" : "Mute");
}

var volTimer = null;

player.onvolumechange = function (e) {
    config.volume = player.volume;
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
        $('.fa-play-circle').attr('data-title', config.paused ? "Play" : "Pause");
        $('.fa-volume-up').attr('data-title', btnMuted.checked ? "Unmute" : "Mute");

        player.muted = btnMuted.checked = config.isMuted;
        player.volume = volcontrol.value = config.volume;
    }
    playVideo(v);
}
