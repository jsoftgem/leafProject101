/**
 * Created by Jerico on 28/09/2015.
 */

var RGB = function (r, g, b) {
  this.r = r;
  this.g = g;
  this.b = b;

  this.setR = function (r) {
    this.r = r;
  };

  this.setG = function (g) {
    this.g = g;
  };

  this.setB = function (b) {
    this.b = b;
  };

  this.rangeEquals = function (rgb, range) {

    var rg = range ? range : 5;

    var red = this.r === rgb.r || (this.r > rgb.r && (this.r - rgb.r) <= rg) || (rgb.r > this.r && (rgb.r - this.r) <= rg);

    var green = this.g === rgb.g || (this.g > rgb.g && (this.g - rgb.g) <= rg) || (rgb.g > this.g && (rgb.g - this.g) <= rg);

    var blue = this.b === rgb.b || (this.b > rgb.b && (this.b - rgb.b) <= rg) || (rgb.b > this.b && (rgb.b - this.b) <= rg);


    console.debug("range-equals.red", red);
    console.debug("range-equals.green", green);
    console.debug("range-equals.blue", blue);

    return red && green && blue;
  };

  return this;
};

RGB.prototype.equals = function (RGB) {
  return this.r === RGB.r & this.g === RGB.g & this.b === RGB.b;
};

RGB.prototype.valueOf = function () {
  return this.r + this.g + this.b;
};

RGB.prototype.toString = function () {
  return this.r + this.g + this.b;
};

function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(RGB) {
  return "#" + componentToHex(RGB.r) + componentToHex(RGB.g) + componentToHex(RGB.b);
}

function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? new RGB(parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16))
    : null;
}

function hexEquals(hex1, hex2) {
  var rgb1 = hexToRgb(hex1);
  var rgb2 = hexToRgb(hex2);
  return rgb1.rangeEquals(rgb2,10);
}


function getChromaStatus(sourceChroma, deficiencyChroma) {
  var matchedColor = 0;

  source: for (var i = 0; i < sourceChroma.length; i++) {
    var sourceHex = sourceChroma[i];
    def: for (var j = 0; i < deficiencyChroma.length; j++) {
      var defHex = deficiencyChroma[j];
      if (sourceHex === defHex) {
        matchedColor++;
        continue source;
      }
    }
    var percent = (matchedColor * 100) / deficiencyChroma.length;

    return {
      count: matchedColor,
      percent: percent
    };


  }


}
