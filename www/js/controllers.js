angular.module('starter.controllers', [])
  .controller("homeCtrl", ["$scope", "$timeout", "$ionicModal", "LeafCamera", "Deficiency", "FluidIterator", function (scope, timeout, ionicModal, camera, Deficiency, FluidIterator) {
    scope.isScanning = false;
    scope.scanMessages = undefined;
    scope.deficienciesScanned = [];

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
      scope.isScanning = true;
      scope.deficienciesScanned = [];
      scope.scanMessages = "Getting image palette...";
      var palette = camera.getPalette(scope.imageData);


      scope.scanMessages = "Scaling...";

      palette.then(function (dataPalette) {

        var chroma = camera.getChroma(dataPalette);

        chroma.then(function (chromaData) {
          scope.scanMessages = "Scanning for deficiencies...";
          var deficiency = new Deficiency();
          deficiency.getDeficiencies().then(function (deficiencies) {
            console.debug("deficiencies", deficiencies);
            var deficiencyIterator = new FluidIterator(deficiencies);
            deficiencyIterator.next(function (def, $index, proceed) {
              console.debug("def", def);
              var palette = deficiency.getPalette(def);
              palette.then(function (defPalette) {
                console.debug("def-palette", defPalette);
                var deficiencyChroma = camera.getChroma(defPalette);
                deficiencyChroma.then(function (defChroma) {
                  scope.scanMessages = "Checking status...";
                  console.debug("defChroma", defChroma);
                  var chromaStatus = deficiency.getStatus(chromaData, defChroma, def);
                  scope.scanMessages = "Checking for deficiencies...";
                  chromaStatus.then(function (status) {
                    console.debug("chromaStatus", chromaStatus);
                    scope.deficienciesScanned.push(status);
                    if ($index === (deficiencyIterator.length - 1)) {
                      scope.isScanning = false;
                    }
                  });
                });
              });
              proceed();
            }).then(function () {

            });
          });
        });
      });
    };

    scope.clear = function () {
      scope.imageData = undefined;
      scope.deficienciesScanned = [];
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

