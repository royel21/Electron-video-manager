var sld12232 = $('.slider')[0];
var $sltrack = $('.slider .slider-track');
var $slTrackProgress = $('.slider .slider-progress');
var $slthumb = $('.slider .slider-thumb');
var vpreview = $('#v-preview')[0];
var player = $('#player')[0];
var slthumbPresses = false;
var offsetW = 0;

Number.prototype.map = function (in_min, in_max, out_min, out_max) {
    return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

getOffset = () => sld12232.offsetLeft + 12.5;

class SliderRange {
    constructor() {
        this.oninput = null;
        this._value = 50;
        this._min = 0;
        this._max = 100;
        $sltrack.mousedown((e) => {
            slthumbPresses = true;
            offsetW = Math.floor(sld12232.offsetWidth - 12);
            this.updateValue(e.pageX - getOffset());
        });

        $slthumb.mousedown((e) => {
            slthumbPresses = true;
            offsetW = Math.floor(sld12232.offsetWidth - 13);
        });

        $(document).mousemove((ev) => {
            if (slthumbPresses) {
                var newPos = Math.floor(ev.pageX - getOffset());
                if (newPos > -11 && newPos < offsetW) {
                    this.updateValue(newPos);
                }
            }
        });
        
        $sltrack.mousemove((ev) => {
            var newPos = Math.floor(ev.pageX - getOffset());
            $('.slider-preview').css({ left: newPos-20 });
            vpreview.currentTime = Number(newPos.map(-10, offsetW - 1, this.min, this.max).toFixed(2))
        });

        offsetW = Math.floor(sld12232.offsetWidth - 12);
        $(document).mouseup(() => {
            slthumbPresses = false;
        });
        
        $(window).on('resize', () => {
            offsetW = Math.floor(sld12232.offsetWidth - 13);
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
        this._value = Number(val.map(-10, offsetW - 1, this.min, this.max).toFixed(2));
        if (this.oninput) {
            this.oninput(this._value);
        }
        this.updatePos();
    }

    updatePos() {
        if (typeof this._value === "number") {
            $slthumb.css({ left: this._value.map(this._min, this._max, -10, offsetW - 1) });
            $slTrackProgress.css({ width: this._value.map(this._min, this._max, 0, 100) + "%" });
        }
    }
}

var Slider = new SliderRange();
vpreview.src = "D:\\anime\\[by d_a_HD] One Piece (701).mp4";
player.src = vpreview.src;



player.onloadedmetadata = function (e) {
    Slider.min = 0;
    Slider.max = player.duration;
    Slider.value = 0;
}
Slider.min = player;
Slider.max = 1;
Slider.value = 0.5;
Slider.oninput = (value) => {
   player.currentTime = value;
}