// var sld12232 = $('.slider')[0];
// var $slider_track = $('.slider .slider-track');
// var $slider_trackProgress = $('.slider .slider-progress');
// var $slider_thumb = $('.slider .slider-thumb');
// var isSliderThumbPressed = false;


class SliderRange {
    constructor(el) {
        this.oninput = null;
        this.onPreview = null;
        this._value = 50;
        this._min = 0;
        this._max = 100;
        this.$element = $(el);
        this.isSliderThumbPressed = false;
        this.$slider = $(`<div id="-${new Date().getTime()}" class="rc-slider">
                <div class="rc-track">
                    <div class="rc-progress"></div>
                </div>
                <span class="rc-thumb"></span>
                <span class="rc-preview" data-title="00:00">
                    <span class="rc-preview-content"></span>
                    <div><span class="rc-preview-title"></div>
                    <span class="rc-preview-arrow">
                    </span>
                </span></div>`);

        this.$element.empty().append(this.$slider);

        this.$slider.find('.rc-track').mousedown((e) => {
            this.isSliderThumbPressed = true;
            this.updateValue(e.pageX - this.getOffset());
        });

        this.$slider.find('.rc-thumb').mousedown((e) => {
            this.isSliderThumbPressed = true;
        });

        $(document).mousemove((ev) => {
            if (this.isSliderThumbPressed) {
                var newPos = Math.floor(ev.pageX - this.getOffset());
                if (newPos > -11 && newPos < this.offsetW()) {
                    this.updateValue(newPos);
                }
            }
        });

        this.$slider.find('.rc-track').on('mousemove', (ev) => {
            if (this.onPreview) {
                var newPos = Math.floor(ev.pageX - this.getOffset());
                var current = Number(newPos.map(-10, this.offsetW() - 1, this.min, this.max).toFixed(2));
                this.$slider.find('.rc-preview').css({ display: "block", left: newPos - 36 });
                this.onPreview(current);
            }
        });

        this.$slider.mouseleave(() => this.$slider.find('.rc-preview').css({ display: "none" }));
        this.$slider.find('.rc-thumb').mouseenter(() => this.$slider.find('.rc-preview').css({ display: "none" }));
        $(document).mouseup(() => this.isSliderThumbPressed = false);

        $(window).on('resize', () => {
            this.updatePos();
        });
    }

    getOffset() {
        return this.$slider[0].offsetLeft + 12.5;
    }

    offsetW() {
        return Math.floor(this.$slider[0].offsetWidth) - 13;
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
        console.log(this.min, this.max, this._value)
        this.updatePos();
    }

    setPreviewContent(el) {
        this.$slider.find('.rc-preview-content').empty().append(el);
    }

    setPreviewTitle(text){
        this.$slider.find('.rc-preview-title').text(text);
    }

    updateValue(val) {
        this._value = Number(val.map(-10, this.offsetW() - 1, this.min, this.max).toFixed(2));
        if (this.oninput) {
            this.oninput(this._value);
        }
        this.updatePos();
    }

    updatePos() {
        if (typeof this._value === "number") {
            this.$slider.find('.rc-thumb').css({ left: this._value.map(this._min, this._max, -10, this.offsetW() - 1) });
            this.$slider.find('.rc-progress').css({ width: this._value.map(this._min, this._max, 0, 100) + "%" });
        }
    }

    cleanUp() {
        this.$element.empty();
    }
}
