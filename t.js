
// // var vthumb = document.getElementById('v-seek-thumb');
// // var isMoving = false;
// // var xpos = 0;
// // vseeker.onmousedown = (e) => {
// //     xpos = e.pageX - vseeker.offsetLeft;
// //     isMoving = true;
// //     console.log(xpos);
// // }

// // $('body').mouseup((e) => {
// //     isMoving = false;
// // });

// // vseeker.onclick = (e) => {
// //     var newPos = e.pageX - vseeker.offsetLeft - 12.5;
// //     vthumb.style.left = newPos + "px";
// // }

// // $('body').mousemove((e) => {
// //     var newPos = e.pageX - vseeker.offsetLeft - 12.5;
// //     if (isMoving && newPos > 0 && newPos < vseeker.offsetWidth - 16) {
// //         vthumb.style.left = newPos + "px";
// //         var value = newPos.map(0, vseeker.offsetWidth - 16, 0, player.duration);
// //         console.log(Math.floor(value))
// //     }
// // });


// //const extractFrames = require('ffmpeg-extract-frames')
// // generatePreview({
// //     input: 'E:\\dev\\Swing_Out_Sisters_1-2_ESP_www.UnderHentai.net.mp4',
// //     output: './cover/1.jpg',
// //     width: 128,
// //     row: 5,
// //     cols: 5,
// //     numFrames: 20,
// //     padding: 5,
// //     mqrgin: 5
// // }).then(() => {
// //     console.log('finish', start - new Date());
// // });

// // extract 3 frames at 1s, 2s, and 3.5s respectively
// // video = 'E:\\dev\\Swing_Out_Sisters_1-2_ESP_www.UnderHentai.net.mp4'
// // extractFrames({
// //     input: video,
// //     output: path.join('./cover/', path.basename(video).split('.')[0] + '.png'),
// //     offsets: [
// //         5000
// //     ]
// // }).then(() => {
// //     console.log('finish', new Date()-start);
// // });

// const generatePreview = require('ffmpeg-generate-video-preview');

// var ffmpeg = require("fluent-ffmpeg");
// var ffpstatic = require('ffprobe-static');
// var ffmstatic = require('ffmpeg-static');

// ffmpeg.setFfmpegPath(ffmstatic.path) //Argument path is a string with the full path to the ffmpeg binary.
// ffmpeg.setFfprobePath(ffpstatic.path) //Argument path is a string with the full path to the ffprobe binary.

// createThumb = async () => {
//     for (var video of videos) {
//         start = new Date();
//         await new Promise((resolve, rejected) => {
//             ffmpeg(video)
//                 .screenshots({
//                     timestamps: ["26.9%"],
//                     filename: '%b',
//                     folder: './covers/',
//                     size: '240x?'
//                 }).on('end', () => {
//                     resolve();
//                 });
//         }).then(() => {
//             console.log('finish', new Date() - start);
//         });
//     }
// }



// convertVideo = async (video) => {
//     var newFile = path.join('G:\\Jav2\\proccesses', path.basename(video).split('.')[0] + '.mp4');
//     console.log(newFile);
//     return new ffmpeg({
//         source: video,
//         nolog: false
//     })
//         .withVideoCodec('libx264')
//         .fps(29.7)
//         .withVideoBitrate(368)
//         .withAudioBitrate('64k')
//         .withAudioChannels(1)
//         .size('840x?')
//         .toFormat('mp4').on('progress', function (progress) {
//             console.log('Processing: ' + progress.percent.toFixed(2) + '% done');
//         })
//         .on('end', () => {
//             console.log(`file:${video} has been converted succesfully`);
//             if (videoIndex < videos.length - 1) {
//                 playVideo(++videoIndex);
//             }
//         }).saveToFile(newFile);
// }