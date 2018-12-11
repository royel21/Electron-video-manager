const extractFrames = require('ffmpeg-extract-frames')

test = async () =>{
    await extractFrames({
        input: 'media/1.mp4',
        output: './screenshot-%i.jpg',
        offsets: [
          1000,
          2000,
          3500
        ]
      })
}

test();
// extract 3 frames at 1s, 2s, and 3.5s respectively
