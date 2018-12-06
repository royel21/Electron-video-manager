var sld12232 = $('.slider')[0];
var $slider_track = $('.slider .slider-track');
var $slider_trackProgress = $('.slider .slider-progress');
var $slider_thumb = $('.slider .slider-thumb');
var player = $('#player')[0];
var slthumbPresses = false;

getOffset = () => sld12232.offsetLeft + 12.5;

offsetW = () => Math.floor(sld12232.offsetWidth - 13);

class SliderRange {
    constructor(video) {
        this.oninput = null;
        this._value = 50;
        this._min = 0;
        this._max = 100;
        this.vpreview = $('#v-preview')[0];

        $slider_track.mousedown((e) => {
            slthumbPresses = true;
            this.updateValue(e.pageX - getOffset());
            console.log("click")
        });

        $slider_thumb.mousedown((e) => {
            slthumbPresses = true;
        });

        $(document).mousemove((ev) => {
            if (slthumbPresses) {
                var newPos = Math.floor(ev.pageX - getOffset());
                if (newPos > -11 && newPos < offsetW()) {
                    this.updateValue(newPos);
                }
            }
        });
        
        $slider_track.mousemove((ev) => {
            var newPos = Math.floor(ev.pageX - getOffset());
            this.vpreview.currentTime = Number(newPos.map(-10, offsetW() - 1, this.min, this.max).toFixed(2));
            $('#slider-preview').css({ left: newPos-30 }).attr('data-time',formatTime(this.vpreview.currentTime));
        });

        $(document).mouseup(() => {
            slthumbPresses = false;
        });
        
        $(window).on('resize', () => {
            this.updatePos();
        });
    }

    get max() {
        return this._max;
    }

    set max(val) {
        this._max = val;
        if (this._value > val) this._value = val;
    }

    get min() {
        return this._min;
    }

    set min(val) {
        this._min = val;
        if (this._value < val) this._value = val;
    }

    get value() {
        return this._value;
    }

    set value(val) {
        this._value = val < this.min ? this.min : val > this.max ? this.max : val;
        this.updatePos();
    }

    updateValue(val) {
        this._value = Number(val.map(-10, offsetW() - 1, this.min, this.max).toFixed(2));
        if (this.oninput) {
            this.oninput(this._value);
        }
        this.updatePos();
    }

    updatePos() {
        if (typeof this._value === "number") {
            $slider_thumb.css({ left: this._value.map(this._min, this._max, -10, offsetW() - 1) });
            $slider_trackProgress.css({ width: this._value.map(this._min, this._max, 0, 100) + "%" });
        }
    }

    setVideo(v){
        this.vpreview.src = v;
    }
}
