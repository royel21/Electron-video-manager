const winex = require('win-explorer')
const path = require('path')
const remote = require('electron').remote
const mainWin = remote.BrowserView
const generatePreview = require('ffmpeg-generate-video-preview');
const fs = require('fs-extra')

var ffmpeg = require("fluent-ffmpeg")
ffmpeg.setFfmpegPath("./ffmpeg/bin/ffmpeg.exe") //Argument path is a string with the full path to the ffmpeg binary.
ffmpeg.setFfprobePath("./ffmpeg/bin/ffprobe.exe") //Argument path is a string with the full path to the ffprobe binary.

Number.prototype.map = function (in_min, in_max, out_min, out_max) {
    return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

var volcontrol = document.getElementById('v-vol-control');
var vseeker = document.getElementById('v-seek');
var btnPlay = document.getElementById('v-play');
var videoTime = "00:00:00";
$('#v-close').click(() => {
    window.close();
});

var dir = "G:\\Jav2\\resize"

var videos = winex.ListFiles(dir).filter(v => {
    return ['mp4', 'mkv', 'avi'].indexOf(v.extension.toLowerCase()) > -1
}).sort((a, b) => {
    var a1 = a.FileName.replace(/\[|\(/ig, "0");
    var b1 = b.FileName.replace(/\[|\(/ig, "0");
    return a1.localeCompare(b1);
}).map((video) => {
    return path.join(dir, video.FileName);
});
console.log(videos);
var player = $('#player')[0];
// player.setAttribute("controls", "controls")
var index = 0;

$('#v-next').click(() => {

    if (index < videos.length - 1) {
        playVideo(++index);
    }
});

$('#v-prev').click(() => {
    if (index > 0) {
        playVideo(--index);
    }
});

$('#reload-list').click(() => {
    videos = winex.ListFiles(dir).filter(v => {
        return ['flv', 'FLV'].indexOf(v.extension) > -1
    }).map((video) => {
        return path.join(dir, video.FileName);
    }).sort();
    $('#v-index').attr('max', videos.length - 1)
    console.log(videos.length);
    index = 0;
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
            if (index < videos.length - 1) {
                playVideo(++index);
            }
        }).saveToFile(newFile);
}

playVideo = async (index) => {
    var v = videos[index]
    player.src = v;
    //convertVideo(v);
    $('#title').text(v);
    $('#v-index').val(index);
    console.time('s');
    // ffmpeg.ffprobe(v, function(err, metadata) {
    //     console.dir(metadata);
    //     console.timeEnd('s');
    // });
}


$('#v-index').attr('min', 0)
$('#v-index').attr('max', videos.length - 1)
$('#v-index').attr('value', 0)

$('#v-index').on('change', (val) => {
    var val = $('#v-index').val();
    if (val > 0 && val < videos.length - 1) {
        index = val;
        playVideo(val);
    }
    console.log(val)
});

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

ajustSeekerPos = () => {
    var $vseeker = $(vseeker);
    var newPoint, newPlace;
    // Cache this for efficiency

    // Measure width of range input
    width = $('#video-seeker').width();

    // Figure out placement percentage between left and right of input
    newPoint = (vseeker.value) / (player.duration);

    newPlace = (width * newPoint.toFixed(3));

    $vseeker.next("output")
        .css({
            left: newPlace,
            marginLeft: newPoint.map(0.0, 1.0, 11, -10)
        }).text(videoTime);
}


player.onloadedmetadata = function (e) {
    vseeker.min = 0.0;
    vseeker.max = player.duration;
    vseeker.value = 0.0;
    console.timeEnd('s');
    ajustSeekerPos();
}

vseeker.oninput = (e) => {
    var v = e.target.value;
    player.currentTime = v;

    var h = Math.floor(v / 3600);
    var m = Math.floor((v / 3600 - h) * 60);
    var s = v % 60;
    videoTime = String(h).padStart(2, "0") + ':' + String(m).padStart(2, "0") + ':' + String(s).padStart(2, "0");
    ajustSeekerPos();
}
volcontrol.oninput = (e) => {
    player.volume = volcontrol.value;
}

btnPlay.onchange = () => btnPlay.checked ? player.play() : player.pause()

player.onmousedown = (e) => {
    if(e.which == 1){
        player.paused ? player.play() : player.pause();
    }
}

//createThumb();
playVideo(0);
