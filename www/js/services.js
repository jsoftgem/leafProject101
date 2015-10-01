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
      checkForDeficiency: function (imageHex, defChroma) {

        var chromaIterator = new FluidIterator(defChroma);

        return chromaIterator.next(function (value, index, proceed, stop) {
          if (hexEquals(imageHex, value)) {
            stop(true);
          }
          proceed();
        });
      },
      getStatus: function (sourceChroma, defChroma, def, message) {
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
              defIterator.next(function (dChroma, dIndex, dproceed, end) {
                console.debug("fluid-iterator.sourceIterator.dChroma", dChroma);
                timeout(function () {
                  if (hexEquals(sChroma, dChroma)) {
                    status.matchedColor++;
                    status.percent = (status.matchedColor * 100) / defChroma.length;
                    status.percent = Math.floor(status.percent);
                    end();
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

    var fluidIterator = function (values) {
      var endOnly = false;
      var q = $q.defer();
      var array = values;
      var length = array.length;
      var index = 0;

      function hasNext() {
        return index < length;
      }

      function traverse(nextCallback) {
        var value = undefined;
        if (index < array.length) {
          value = array[index];
        } else {
          index--;
        }

        nextCallback(value, index,
          function () {
            index++;
            if (hasNext()) {
              return traverse(nextCallback);
            } else {
              if (!endOnly) {
                index--;
                q.resolve({index: index, data: array[index]});
              } else {
                return traverse(nextCallback);
              }
            }
          }, function (data) {
            q.resolve({index: index, data: data ? data : array[index]});
          });

      }

      function next(nextCallback) {
        try {
          traverse(nextCallback);
        } catch (err) {
          q.reject(err);
        }
        return q.promise;
      }

      function setEndCallbackOnly(end) {
        endOnly = end;
      }

      return {
        next: next, length: length, setEndCallbackOnly: setEndCallbackOnly
      };
    };

    return fluidIterator;
  }]).factory("FluidAsyncIterator", ["$timeout", "$q", "$http", function (t, $q, h) {

    var fluidAsyncIterator = function (url, method) {
      var endOnly = false;
      var q = $q.defer();
      var method = method ? method : "GET";
      var url = url;
      var array = undefined;
      var length = array.length;
      var index = 0;

      function hasNext() {
        return index < length;
      }

      function traverse(nextCallback) {
        var value = undefined;
        if (index < array.length) {
          value = array[index];
        } else {
          index--;
        }

        nextCallback(value, index,
          function () {
            index++;
            if (hasNext()) {
              return traverse(nextCallback);
            } else {
              if (!endOnly) {
                index--;
                q.resolve({index: index, data: array[index]});
              } else {
                return traverse(nextCallback);
              }
            }
          }, function (data) {
            q.resolve({index: index, data: data ? data : array[index]});
          });

      }

      function next(nextCallback) {
        try {
          traverse(nextCallback);
        } catch (err) {
          q.reject(err);
        }
        return q.promise;
      }

      function setEndCallbackOnly(end) {
        endOnly = end;
      }

      return {
        next: next, length: length, setEndCallbackOnly: setEndCallbackOnly
      };

    };

    return fluidAsyncIterator;
  }]);


