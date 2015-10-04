angular.module('starter.controllers', [])
  .controller("homeCtrl", ["$scope", "$timeout", "$ionicModal", "LeafCamera", "Deficiency", "FluidIterator", function (scope, timeout, ionicModal, camera, Deficiency, FluidIterator) {
    scope.isScanning = false;
    scope.scanMessages = undefined;
    scope.deficienciesScanned = [];
    scope.imageData = "leaf-veins.jpg";
    ionicModal.fromTemplateUrl("deficiencyDesc.html", {
      scope: scope,
      animation: 'slide-in-up'
    }).then(function (modal) {
      scope.defModal = modal;
    });

    scope.getPhoto = function () {
      scope.clear();
      camera.getPicture().then(function (data) {
        console.debug("camera", data);
        scope.imageData = data;
      }, function (err) {
        console.error("camera", err);
      });
    };

    scope.selectFile = function ($file) {
      console.debug("selectFile", $file);

      FileAPI.readAsDataURL($file, function (event) {
        var dataURL = event.result;
        console.debug("dataURL", dataURL);
        timeout(function () {
          scope.imageData = dataURL;
        });
      });

    };

    scope.scan = function () {
      scope.matches = [];
      scope.isScanning = true;
      scope.deficienciesScanned = [];
      scope.scanMessages = "Getting image palette...";
      var palette = camera.getPalette(scope.imageData);


      scope.scanMessages = "Scaling...";

      palette.then(function (dataPalette) {

        var chroma = camera.getChroma(dataPalette);
        chroma.then(function (chromaData) {
          scope.scanMessages = "Scanning for deficiencies 0/" + chromaData.length;
          var dataChromaIterator = new FluidIterator(chromaData);
          dataChromaIterator.next(function (mainValue, index, mainProceed, endMain) {
            if (mainValue) {
              scope.scanMessages = "Scanning for deficiencies " + Math.round((((index + 1) * 100) / dataChromaIterator.length)) + "%";
              var deficiency = new Deficiency();
              deficiency.getDeficiencies().then(function (deficiencies) {
                var deficiencyIterator = new FluidIterator(deficiencies);
                deficiencyIterator.next(function (def, defIndex, defProceed) {
                  console.debug("deficiency", def);
                  var defPalette = deficiency.getPalette(def);
                  defPalette.then(function (defPalettes) {
                    deficiency.checkForDeficiency(mainValue, defPalettes)
                      .then(function (hasMatched) {
                        if (hasMatched.data === true) {
                          if (scope.matches === undefined) {
                            scope.matches = [];
                          }
                          if (scope.matches[def.deficiency] === undefined) {
                            scope.matches[def.deficiency] = {};
                            scope.matches[def.deficiency].matched = 1;
                            scope.deficienciesScanned.push({
                              deficiency: def
                            });
                          } else {
                            scope.matches[def.deficiency].matched = scope.matches[def.deficiency].matched + 1;
                          }

                          scope.matches[def.deficiency].percent = Math.round((scope.matches[def.deficiency].matched * 100) / defPalettes.length);

                          console.debug("matches", scope.matches);
                        }

                      });
                  });
                  defProceed();
                }).then(function () {
                  mainProceed();
                });
              });
            } else {
              timeout(mainProceed, 10000);
            }
          }).then(function () {
            scope.isScanning = false;
          });
        });
      });
    };

    scope.clear = function () {
      scope.imageData = undefined;
      scope.deficienciesScanned = [];
      scope.matches = [];
    };


    scope.viewDef = function (deficiency) {
      scope.selectedDeficiency = deficiency;
      scope.defModal.show();
    };

    scope.$on("modal.hidden", function () {
      scope.selectedDeficiency = undefined;
    });

  }
  ]);

