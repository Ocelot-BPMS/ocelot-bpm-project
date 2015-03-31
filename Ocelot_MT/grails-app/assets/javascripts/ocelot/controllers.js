/**
 * Created by sergi on 08/08/14.
 */

var ocelotControllers = angular.module('ocelotControllers', []);

ocelotControllers.controller('PaletteCtrl', function ($scope, Palette, PaletteItem, Category) {
    //Get all categories available
    $scope.paletteId = 1;

    Category.query().$promise.then(function (data) {
        //Sort categories by its id
        data.sort(function (a, b) {
            return a.id - b.id;
        });

        //Get only the names we wanna use
        $scope.categories = data.map(function (category) {
            return category.name
        });
    });

    $scope.categoryGroup = {};
    Palette.get({id: $scope.paletteId}).$promise.then(function (palette) {

        $scope.paletteItems = palette.paletteItems;

        palette.paletteItems.map(function (item) {
            var category = item.category.name;

            $scope.categoryGroup[category] = $scope.categoryGroup[category] || [];

            $scope.categoryGroup[category].push(item);
        });
    });

    $scope.orderProp = 'name';
    $scope.level = 1;

    $scope.filterByLvl = function (item) {
        return item.level <= $scope.level;
    };

    //TODO move this filter to filters.js
    $scope.showCustomPaletteItems = function (item) {
        //Custom defined in PaletteMarshaller.groovy
        return item.type == 'custom';
    };

    $scope.change = function (item) {
        item.activated = !item.activated;
        // Notify server of changes
        PaletteItem.update({id: $scope.paletteId, itemId: item.id}, item);
    };

    $scope.delete = function (item) {
        var id = item.id;
        var category = item.category.name;
        PaletteItem.delete({id: $scope.paletteId, itemId: id}).$promise.then(function () {
            var list = $scope.paletteItems;
            var i = 0;
            while (i < list.length) {
                if (list[i].type == 'custom' && list[i].id == id) {
                    break;
                }
                i++;
            }

            if (i < list.length) {
                list.splice(i, 1);
            }

            list = $scope.categoryGroup[category];
            i = 0;
            while (i < list.length) {
                if (list[i].type == 'custom' && list[i].id == id) {
                    break;
                }
                i++;
            }

            if (i < list.length) {
                list.splice(i, 1);
            }
        });
    };
});

ocelotControllers.controller('ModelCtrl', function ($scope, $http, $modal, $window, Model, ModelService, $location) {
    $scope.models = Model.query();

    $scope.item = {name: "OcelotBpmn", description: "Description"};

    $scope.createBpmn = function () {

        var modalInstance = $modal.open({
            templateUrl: 'partials/modeler/modelerModal.html',
            controller: 'ModalInstanceCtrl',
            size: 'lg',
            resolve: {
                item: function () {
                    return $scope.item;
                }
            }
        });

        modalInstance.result.then(function (modifiedItem) {
            console.log(modifiedItem);
            ModelService.setId(-1);
            ModelService.setName(modifiedItem.name.replace(/\s/g, ""));
            ModelService.setDescription(modifiedItem.description);
            ModelService.setXML("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<bpmn2:definitions xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:bpmn2=\"http://www.omg.org/spec/BPMN/20100524/MODEL\" xmlns:bpmndi=\"http://www.omg.org/spec/BPMN/20100524/DI\" xmlns:dc=\"http://www.omg.org/spec/DD/20100524/DC\" xmlns:di=\"http://www.omg.org/spec/DD/20100524/DI\" xsi:schemaLocation=\"http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd\" id=\"sample-diagram\" targetNamespace=\"http://bpmn.io/schema/bpmn\">\n  <bpmn2:process id=\"" + modifiedItem.name + "\" name=\"" + modifiedItem.name + "\" isExecutable=\"true\">\n    <bpmn2:StartEvent id=\"StartEvent_1\"/>\n  </bpmn2:process>\n  <bpmndi:BPMNDiagram id=\"BPMNDiagram_1\">\n    <bpmndi:BPMNPlane id=\"BPMNPlane_1\" bpmnElement=\"" + modifiedItem.name + "\">\n      <bpmndi:BPMNShape id=\"_BPMNShape_StartEvent_2\" bpmnElement=\"StartEvent_1\">\n        <dc:Bounds height=\"36.0\" width=\"36.0\" x=\"412.0\" y=\"240.0\"/>\n      </bpmndi:BPMNShape>\n    </bpmndi:BPMNPlane>\n  </bpmndi:BPMNDiagram>\n</bpmn2:definitions>");
            ModelService.setInfo({});
            $location.path('/modeler');
        }, function () {
//            $log.info('Modal dismissed at: ' + new Date());
        });
    };

    //This function opens an element selected in the index
    $scope.open = function (id) {
        Model.get({id: id}).$promise.then(function (model) {
            ModelService.setId(id);
            ModelService.setName(model.name);
            ModelService.setDescription(model.description);
            ModelService.setXML(model.xml);
            ModelService.setInfo(JSON.parse(model.json));
            $location.path('/modeler');
        });
    };

    $scope.removeModel = function (model) {
        if ($window.confirm("Do you want to remove " + model.name + "?")) {
            Model.delete({id: model.id}, function () {
                $scope.models = Model.query();
            });
        }
    };

    $scope.exportBpmn = function (model) {
        $http.get('/ocelot-mt/api/model/export/' + model.id).success(function (data) {
            var bpmn = data.bpmn;
            var encodedData = 'data:application/bpmn20-xml;charset=UTF-8,' + encodeURIComponent(bpmn);

            var pom = document.createElement('a');
            pom.setAttribute('href', encodedData);
            pom.setAttribute('download', model.name + ".bpmn.xml");
            pom.click();

        });
    };

    $scope.modifyDescription = function (model) {

        var modalInstance = $modal.open({
            templateUrl: 'partials/modeler/descriptionModal.html',
            controller: 'ModalInstanceCtrl',
            size: 'lg',
            resolve: {
                item: function () {
                    return model;
                }
            }
        });

        modalInstance.result.then(function (modifiedItem) {
            console.log(modifiedItem);
            Model.update({id: modifiedItem.id}, {description: modifiedItem.description}, function () {
                model.description = modifiedItem.description;
            });
        }, function () {
//            $log.info('Modal dismissed at: ' + new Date());
        });
    };
    //TODO order prop?
});

ocelotControllers.controller('ModalInstanceCtrl', function ($scope, $modalInstance, item) {
    //Clone the default item
    $scope.item = JSON.parse(JSON.stringify(item));

    //Pass the clone-modified item to ModelCtrl
    $scope.ok = function () {
        $modalInstance.close($scope.item);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
});


ocelotControllers.controller('ModelerCtrl', function ($scope, $http, Palette, PaletteItem, Category, ModelService, Model) {
    $scope.bpmnId = ModelService.getId();
    $scope.bpmnName = ModelService.getName();
    $scope.bpmnDescription = ModelService.getDescription();
    $scope.bpmnXML = ModelService.getXML();
    $scope.bpmnInfo = ModelService.getInfo();
    $scope.bpmnSVG = "";

    //Get all categories available
    $scope.paletteId = 1;
    $scope.categoryGroup = {};
    $scope.canvasSelectedItem = "";
    $scope.paletteSelectedItem = "";
    $scope.itemInfo = {};

    $scope.level = 1;

    var paletteProps = {};

    Category.query().$promise.then(function (data) {
        //Sort categories by their id
        data.sort(function (a, b) {
            return a.id - b.id;
        });

        //Get only the names we wanna use
        $scope.categories = data.map(function (category) {
            return category.name
        });
    });


    Palette.get({id: $scope.paletteId}).$promise.then(function (palette) {

        $scope.paletteItems = palette.paletteItems;

        palette.paletteItems.map(function (item) {
            var category = item.category.name;

            paletteProps[item.bpmnElem] = item.props;

            $scope.categoryGroup[category] = $scope.categoryGroup[category] || [];

            $scope.categoryGroup[category].push(item);
        });
    });


    // This function selects an element from paletteModeler and notifies the modeler directive
    $scope.selectPalette = function (item) {
        $scope.paletteSelectedItem = item;
    };

    //This function will be triggered at ContextPadProviders. This method also shows the
    // information of the selected info
    $scope.selectedCanvas = function (item) {
        $scope.canvasSelectedItem = item;
        console.log("", item);

        if (!$scope.bpmnInfo[item.id]) {
            //Search the properties in the palette and copy their properties
            var props = JSON.parse(JSON.stringify(paletteProps[item.type]));
            $scope.bpmnInfo[item.id] = props;
        }

        $scope.itemInfo = $scope.bpmnInfo[item.id];
    };

    $scope.filterByLvl = function (item) {
        return item.level <= $scope.level;
    };

    $scope.saveModel = function () {
        var modeler = $scope.modelerInstance;

        modeler.saveSVG(function (err, svg) {
            $scope.bpmnSVG = svg;
        });

        modeler.saveXML(function (err, xml) {
            $scope.bpmnXML = xml;
        });

        if ($scope.bpmnId > 0) {
            Model.update({id: $scope.bpmnId}, {name: $scope.bpmnName, description: $scope.bpmnDescription, xml: $scope.bpmnXML, json: $scope.bpmnInfo, svg: $scope.bpmnSVG});
        } else {
            Model.save({name: $scope.bpmnName, description: $scope.bpmnDescription, xml: $scope.bpmnXML, json: $scope.bpmnInfo, svg: $scope.bpmnSVG});
        }
    };

    $scope.downloadSVG = function () {
        var modeler = $scope.modelerInstance;

        modeler.saveSVG(function (err, svg) {
            $scope.bpmnSVG = svg;
        });

        var encodedData = 'data:application/bpmn20-xml;charset=UTF-8,' + encodeURIComponent($scope.bpmnSVG);

        var pom = document.createElement('a');
        pom.setAttribute('href', encodedData);
        pom.setAttribute('download', $scope.bpmnName + ".svg");
        pom.click();
    };

    $scope.exportAndSave = function () {
        $scope.saveModel();
        $http.get('/ocelot-mt/api/model/export/' + $scope.bpmnId).success(function (data) {
            var bpmn = data.bpmn;
            var encodedData = 'data:application/bpmn20-xml;charset=UTF-8,' + encodeURIComponent(bpmn);

            var pom = document.createElement('a');
            pom.setAttribute('href', encodedData);
            pom.setAttribute('download', $scope.bpmnName + ".bpmn.xml");
            pom.click();

        });
    };
});

ocelotControllers.controller('PaletteItemCtrl', function ($scope, $routeParams, Category, PaletteItem) {
    //Get all categories available
    $scope.categories = Category.query();

    $scope.item = PaletteItem.get({id: $routeParams.paletteId, itemId: $routeParams.itemId});

    $scope.save = function () {
        PaletteItem.update({id: $routeParams.paletteId,itemId: $scope.item.id}, $scope.item);
    };

    $scope.addProperty = function () {
        var property = {name: "", value: "", type: "string"};

        $scope.item.props = $scope.item.props || [];

        $scope.item.props.push(property);
    };


    $scope.removeProperty = function (index) {
        var props = $scope.item.props;

        if (props) {
            props.splice(index, 1);
        }
    };

    $scope.resetValue = function (property) {
        switch (property.type) {
            case "boolean":
                property.value = false;
                break;
            default :
                property.value = "";
        }
    };

    $scope.changeActivated = function () {
        $scope.item.activated = !$scope.item.activated;
    }
});

ocelotControllers.controller('CreatePaletteItemCtrl', function ($scope, $routeParams, $location, Category, PaletteItem) {
    //Get all categories available
    $scope.categories = Category.query();

    $scope.item = {name: "New Item", description: "Place a description here", icon: "No Icon", category: {id: 1}, activated: false, props: [{"name":"formKey","type":"string","value":"","extension":"camunda"},{"name":"formData","type":"string","value":[],"extension":"camundaFormData"}], level: 1};

    $scope.save = function () {

        console.log("Route params = " + $routeParams.paletteId);

        PaletteItem.save({id: $routeParams.paletteId}, $scope.item).$promise.then(function () {
            $location.path('/palette');
        });

    };


    $scope.addProperty = function () {
        var property = {name: "", value: "", type: "string"};
        $scope.item.props.push(property);
    };


    $scope.removeProperty = function (index) {
        var props = $scope.item.props;

        if (props) {
            props.splice(index, 1);
        }
    };

    $scope.resetValue = function (property) {
        switch (property.type) {
            case "boolean":
                property.value = false;
                break;
            default :
                property.value = "";
        }
    };

    $scope.changeActivated = function () {
        $scope.item.activated = !$scope.item.activated;
    }
});