var volcontrol = document.getElementById('v-vol-control');
var btnPlay = document.getElementById('v-play');
var btnMuted = document.getElementById('v-mute');
var player = document.getElementById('player');
var vpreview = $('<video>')[0];
var $vTotalTime = $('#v-total-time');

var isPlayer = () => currentView == 3;
var totalTime;
var videoIndex = 0;
var hour = false;
var vDuration;
var Slider = null;
var update = false;

$('#v-next').click(() => {
    if (videoIndex < filesList.length - 1) {
        processFile(filesList[++videoIndex].Name);
    } else {
        returnToFb();
    }
});

$('#v-prev').click(() => {
    if (videoIndex > 0) {
        processFile(filesList[--videoIndex].Name);
    } else {
        returnToFb();
    }
});

playerCleanUp = async () => {
    updateItemProgress(currentFile);
    $(window).off('wheel', wheelScroll);
    $(document).off('keydown', playerKeyHandler);

    if (Slider) {
        Slider.cleanUp();
        Slider = null;
    }
    player.src = "";
}
returnToFb = () => {
    playerCleanUp();
    loadDirectory('').then(()=>{
        selectItem(updateItemProgress(currentFile));
    });
}

$('#v-exit-to-fb').click(returnToFb);

playVideo = async (v) => {
    updateItemProgress(currentFile);
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
    player.currentTime = currentFile.Current - 0.1;
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
    if (videoIndex < filesList.length - 1) {
        var waitEnd = setTimeout(() => {
            if (player.ended)
                processFile(filesList[++videoIndex].Name);
            clearTimeout(waitEnd);
        }, 3000)
    } else {
        returnToFb();
    }
}

playerKeyHandler = (e) => {
    var keys = config.playerkey;
    switch (e.keyCode) {
        case keys.fullscreen.keycode:
            {
                if (e.ctrlKey == keys.fullscreen.isctrl)
                    setfullscreen();
                break;
            }
        case keys.playpause.keycode:
            {
                if (e.ctrlKey == keys.playpause.isctrl)
                    pauseOrPlay();
                break;
            }
        case keys.rewind.keycode:
            {
                if (e.ctrlKey == keys.rewind.isctrl)
                    player.currentTime -= 6;
                break;
            }
        case keys.volumeup.keycode:
            {
                if (e.ctrlKey == keys.volumeup.isctrl) {
                    volcontrol.value = player.volume + 0.05;
                    player.volume = volcontrol.value;
                }
                break;
            }
        case keys.forward.keycode:
            {
                if (e.ctrlKey == keys.forward.isctrl)
                    player.currentTime += 6;
                break;
            }
        case keys.volumedown.keycode:
            {
                if (e.ctrlKey == keys.volumedown.isctrl) {
                    volcontrol.value -= Number(0.05);
                    player.volume = volcontrol.value;
                }
                break;
            }
        case keys.volumemute.keycode:
            {
                if (e.ctrlKey == keys.volumemute.isctrl) {
                    player.muted = btnMuted.checked;
                    config.isMuted = btnMuted.checked;
                    $('.fa-volume-up').attr('data-title', btnMuted.checked ? "Unmute" : "Mute");
                }
                break;
            }
        case keys.nextfile.keycode:
            {
                if (e.ctrlKey == keys.nextfile.isctrl) {
                    if (videoIndex < filesList.length - 1) {
                        processFile(filesList[++videoIndex].Name);
                    } else {
                        returnToFb();
                    }
                }
                break;
            }
        case keys.previousfile.keycode:
            {
                if (e.ctrlKey == keys.previousfile.isctrl) {
                    if (videoIndex > 0) {
                        processFile(filesList[--videoIndex].Name);
                    } else {
                        returnToFb();
                    }
                }
                break;
            }
    }
}

pauseOrPlay = () => {
    var playPause = "Play";
    if (player.paused) {
        player.play().catch(e => {});
    } else {
        player.pause();
        playPause = "Pause";
    }
    $('.fa-play-circle').attr('data-title', playPause);
    btnPlay.checked = config.paused = player.paused;

}

$(player).click((e) => {
    if (e.which == 1) {
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

        $(document).on('keydown', playerKeyHandler);
        $(window).on('wheel', wheelScroll);
        $('.fa-play-circle').attr('data-title', config.paused ? "Play" : "Pause");
        $('.fa-volume-up').attr('data-title', btnMuted.checked ? "Unmute" : "Mute");

        player.muted = btnMuted.checked = config.isMuted;
        player.volume = volcontrol.value = config.volume;
        currentDir = v.folder.Name;

        toggleView(3);
        reloadList(videoFilter);
        $(window).trigger('resize');
    }
    videoIndex = filesList.findIndex(f => f.Name == v.Name);
    playVideo(v);
}

showPlayerConfig = (e) => {

    let $modalconfig = $(template('./template/modal-config.html', mconfig[currentView]));

    $('.content').prepend($modalconfig);

    $modalconfig.find('#v-config').on('keydown keyup keypress click', consumeEvent);

    $modalconfig.find('#modal-close').click(() => {
        hideModal($modalconfig);
        $modalconfig = undefined;
    });

    var keyselect = $modalconfig.find('#key-select')[0];
    var isctrl = $modalconfig.find('#isctrl')[0];
    var keyinput = $modalconfig.find('#keyinput')[0];
    var currentMap = keyselect.value;

    keyselect.oninput = (e) => {
        currentMap = keyselect.value;
        keyinput.value = config.playerkey[currentMap].name;
        isctrl.checked = config.playerkey[currentMap].isctrl;
    }
    keyinput.value = config.playerkey[currentMap].name;
    keyinput.onkeyup = (e) => {
        keyinput.value = e.keyCode == 32 ? "Space" : e.key;
        config.playerkey[currentMap] = {
            name: keyinput.value,
            keycode: e.keyCode,
            isctrl: isctrl.checked
        }
        consumeEvent(e);
        e.preventDefault();
    }

    isctrl.onchange = (e)=>{
        config.playerkey[currentMap].isctrl = isctrl.checked;
    }
    consumeEvent(e);
    positionModal(e, $modalconfig);
}

$('#v-player-config').click(showPlayerConfig);