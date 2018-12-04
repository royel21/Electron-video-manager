const generatePreview = require('ffmpeg-generate-video-preview');

var ffmpeg = require("fluent-ffmpeg")
ffmpeg.setFfmpegPath("./ffmpeg/bin/ffmpeg.exe") //Argument path is a string with the full path to the ffmpeg binary.
ffmpeg.setFfprobePath("./ffmpeg/bin/ffprobe.exe") //Argument path is a string with the full path to the ffprobe binary.

var volcontrol = document.getElementById('v-vol-control');
var vseeker = document.getElementById('v-seek');
var btnPlay = document.getElementById('v-play');
var btnMuted = document.getElementById('v-mute');
var player = document.getElementById('player');
var dir = "D:\\anime"
var videoFilter = ['mp4', 'mkv', 'avi', 'webm'];

var videos = WinDrive.ListFiles(dir).filter(v => {
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

$('#reload-list').click(() => {
    videos = WinDrive.ListFiles(dir).filter(v => {
        return ['flv', 'FLV'].videoIndexOf(v.extension) > -1
    }).map((video) => {
        return path.join(dir, video.FileName);
    }).sort();
    console.log(videos.length);
    videoIndex = 0;
    playVideo(0)
})

convertVideo = async (video) => {
    var newFile = path.join('G:\\Jav2\\proccesses', path.basename(video).split('.')[0] + '.mp4');
    console.log(newFile);
    return new ffmpeg({
        source: video,
        nolog: false
    })
        .withVideoCodec('libx264')
        .fps(29.7)
        .withVideoBitrate(368)
        .withAudioBitrate('64k')
        .withAudioChannels(1)
        .size('840x?')
        .toFormat('mp4').on('progress', function (progress) {
            console.log('Processing: ' + progress.percent.toFixed(2) + '% done');
        })
        .on('end', () => {
            console.log(`file:${video} has been converted succesfully`);
            if (videoIndex < videos.length - 1) {
                playVideo(++videoIndex);
            }
        }).saveToFile(newFile);
}

playVideo = async (videoIndex) => {
    var v = videos[videoIndex]
    player.src = v;
    //convertVideo(v);
    $('#title').text(v);
    console.time('s');
    player.play().catch(e=>{});
}

//const extractFrames = require('ffmpeg-extract-frames')
// generatePreview({
//     input: 'E:\\dev\\Swing_Out_Sisters_1-2_ESP_www.UnderHentai.net.mp4',
//     output: './cover/1.jpg',
//     width: 128,
//     row: 5,
//     cols: 5,
//     numFrames: 20,
//     padding: 5,
//     mqrgin: 5
// }).then(() => {
//     console.log('finish', start - new Date());
// });

// extract 3 frames at 1s, 2s, and 3.5s respectively
// video = 'E:\\dev\\Swing_Out_Sisters_1-2_ESP_www.UnderHentai.net.mp4'
// extractFrames({
//     input: video,
//     output: path.join('./cover/', path.basename(video).split('.')[0] + '.png'),
//     offsets: [
//         5000
//     ]
// }).then(() => {
//     console.log('finish', new Date()-start);
// });
createThumb = async () => {
    for (var video of videos) {
        start = new Date();
        await new Promise((resolve, rejected) => {
            ffmpeg(video)
                .screenshots({
                    timestamps: ["26.9%"],
                    filename: '%b',
                    folder: './covers/',
                    size: '240x?'
                }).on('end', () => {
                    resolve();
                });
        }).then(() => {
            console.log('finish', new Date() - start);
        });
    }
}

ajustSeekerPos = (pos) => {
   var v = pos;

    var h = Math.floor(v / 3600);
    var m = Math.floor((v / 3600 - h) * 60);
    var s = Math.floor(v % 60);
    videoTime = (h == 0 ? "" : String(h).padStart(2, "0") + ':') + String(m).padStart(2, "0") + ':' + String(s).padStart(2, "0");
    
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
    console.timeEnd('s');
    ajustSeekerPos(player.currentTime);
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

player.onmousedown = (e) => {
    if(e.which == 1){
        player.paused ? player.play() : player.pause();
        btnPlay.checked = !player.paused;
    }
}
player.ontimeupdate = (e) => {
    vseeker.value = Math.floor(player.currentTime); 
    ajustSeekerPos(player.currentTime);
}
//createThumb();
//playVideo(0);
player.onended = function() {
    if (videoIndex < videos.length - 1) {
        playVideo(++index);
    }
}