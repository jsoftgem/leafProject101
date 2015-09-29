angular.module('starter.services', [])
  .factory("LeafCamera", ["$q", "$timeout", function ($q, timeout) {
    return {
      getPicture: function (options) {
        var q = $q.defer();
        navigator.camera.getPicture(function (result) {
          q.resolve(result);
        }, function (err) {
          q.reject(err);
        }, options);

        return q.promise;
      },
      getPalette: function (imageSource) {
        var q = $q.defer();
        timeout(function () {
          try {

            var image = new Image();
            image.src = imageSource;
            var colorThief = new ColorThief();
            var palettes = colorThief.getPalette(image, 128);

            var rgbs = new Array();

            rgbs.contains = function (RGB) {
              for (var i in this) {
                var rgb = this[i];
                if (rgb.valueOf() === RGB.valueOf()) return true;
              }
              return false;
            };


            for (var pal in palettes) {
              var palette = palettes[pal];
              var rgb = new RGB();
              rgb.setR(palette[0]);
              rgb.setG(palette[1]);
              rgb.setB(palette[2]);
              if (!rgbs.contains(rgb)) {
                rgbs.push(rgb);
              }
            }

            var hexes = new Array();
            for (var i = 0; i < rgbs.length; i++) {
              var rgb = rgbs[i];
              hexes.push(rgbToHex(rgb));
            }
            q.resolve(hexes);
          } catch (error) {
            q.reject(error);
          }
        });


        return q.promise;
      },
      getChroma: function (palette) {
        var q = $q.defer();

        timeout(function () {
          try {
            var scaleCount = palette.length * 3;
            var chromaColors = chroma.scale(palette).colors(scaleCount);
            q.resolve(chromaColors);
          } catch (error) {
            q.reject(error);
          }
        });

        return q.promise;
      }
    }
  }])
  .factory("Deficiency", ["$q", "$http", "$timeout", "FluidIterator", function ($q, h, timeout, FluidIterator) {

    var deficiency = function () {

    };

    deficiency.prototype = {

      getDeficiencies: function () {
        var q = $q.defer();
        h.get("deficiencies.json")
          .success(function (data) {
            q.resolve(data);
          }).error(function (err) {
            q.reject(err);
          });
        return q.promise;
      },

      getPalette: function (deficiency) {
        var q = $q.defer();
        if (deficiency) {
          h.get(deficiency.colors).success(function (palettes) {
            q.resolve(palettes);
          }).error(function (err) {
            q.reject(err);
          });

        } else {
          q.reject("deficiency undefined");
        }

        return q.promise;
      },
      getStatus: function (sourceChroma, defChroma, def) {
        var q = $q.defer();

        timeout(function () {
          try {


            var status = {
              matchedColor: 0,
              $index: 0
            };

            var sourceIterator = new FluidIterator(sourceChroma);
            sourceIterator.next(function (sChroma, index, proceed) {
              var defIterator = new FluidIterator(defChroma);
              console.debug("fluid-iterator.sourceIterator.sChroma", sChroma);
              defIterator.next(function (dChroma, dIndex, dproceed) {
                console.debug("fluid-iterator.sourceIterator.dChroma", dChroma);
                t(function () {
                  if (hexEquals(sChroma, dChroma)) {
                    status.matchedColor++;
                    status.percent = (status.matchedColor * 100) / defChroma.length;
                    status.percent = Math.floor(status.percent);
                  } else {
                    dproceed();
                  }
                });
              }).then(function (dData) {
                console.debug("fluid-iterator.success.dData", dData);
                proceed();
              });
            }).then(function (data) {
              console.debug("fluid-iterator.success.data", data);
              status.deficiency = def;
              q.resolve(status);
            });

          } catch (error) {
            q.reject(error);
          }

        });

        return q.promise;
      }
    };


    return deficiency;

  }])
  .factory("FluidIterator", ["$timeout", "$q", function (t, $q) {

    var fluidIterator = function (array) {

      var array = array;
      var length = array.length;
      var index = 0;

      function hasNext() {
        return index < length;
      }

      function hasPrevious() {
        return index > -1;
      }


      function traverse(nextCallback) {
        var value = array[index];
        nextCallback(value, index,
          function () {
            index++;
            if (hasNext()) {
              return traverse(nextCallback);
            } else {
              index--;
            }
          },
          function () {
            index--;
            if (hasPrevious()) {
              return traverse(nextCallback);
            } else {
              index++;
            }
          });
      }


      function next(nextCallback) {
        var q = $q.defer();
        try {
          t(function () {
            traverse(nextCallback);
            q.resolve({index: index, data: array[index]});
          });
        } catch (err) {
          q.reject(err);
        }
        return q.promise;
      }


      return {
        next: next, hasPrevious: hasPrevious, hasNext: hasNext, array: array, length: length
      };
    };

    return fluidIterator;
  }]);
