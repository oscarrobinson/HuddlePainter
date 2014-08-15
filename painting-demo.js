CanvasPaths = new Meteor.Collection("canvasPaths");

if (Meteor.isClient) {
    huddleCanvas = HuddleCanvas.create("huddle-orbiter.proxemicinteractions.org", 60422, "Test", {
        //backgroundImage: "../../art.jpg",
        layers: ["canvas-container"],
        callbacks: [

            function() {
                loadCanvas();
            }
        ]
    });


    Template.huddleCanvas.rendered = function() {
        fabricCanvas = new fabric.Canvas('drawing-canvas');
        fabricCanvas.selection = false;

        var hammerCanvas = document.getElementById('huddle-canvas-container');
        var hammer = new Hammer(hammerCanvas);

        var drawingMode = false;

        var pathsAlreadyRendered = [];

        var pathsSelectable = false;

        fabricCanvas.freeDrawingBrush.width = $("#stroke-select").val();

        var getPathObjectForCollection = function(path) {
            var pathObject = {
                coords: path.path,
                positionLeft: path.left,
                positionTop: path.top,
                fill: path.fill,
                stroke: path.stroke,
                strokeLineCap: path.strokeLineCap,
                strokeLineJoin: path.strokeLineJoin,
                strokeWidth: path.strokeWidth,
                pathOffsetX: path.pathOffset.x,
                pathOffsetY: path.pathOffset.y,
                originX: path.originX,
                originY: path.originY
            };
            return pathObject;

        }

        loadCanvas = function() {
            fabricCanvas.setBackgroundColor('rgb(232, 232, 232)', fabricCanvas.renderAll.bind(fabricCanvas));
            fabricCanvas.setDimensions({
                width: huddleCanvas.getFeedSize()[0],
                height: huddleCanvas.getFeedSize()[1]
            });
        }

        var addPathEvents = function(path, id) {
            path.on('selected', function() {
                console.log("PATH SELECTED locking pan || path sectable: " + path.selectable);
                huddleCanvas.panLock();
            });

            path.on('modified', function(e) {
                //console.log("path modified");
                //console.log(this);
                //console.log(CanvasPaths.findOne(id).path);
                //console.log(getPathObjectForCollection(this));
                CanvasPaths.update(id, {
                    $set: {
                        path: getPathObjectForCollection(this)
                    }
                }, function(err, id) {
                    //console.log(err);
                    //console.log(id);
                });

                //console.log(CanvasPaths.findOne(id));
            });
        }

        hammer.on('doubletap', function() {
            //console.log("double tap");
            if (!drawingMode) {
                console.log("DOUBLE TAP NOT IN DRAWING MODE locking pan");
                huddleCanvas.panLock();
                fabricCanvas.isDrawingMode = true;
                drawingMode = true;
            } else {
                console.log("DOUBLE TAP IN DRAWING MODE unlocking pan");
                huddleCanvas.panUnlock();
                fabricCanvas.isDrawingMode = false;
                drawingMode = false;
            }
        });

        fabricCanvas.on('selection:cleared', function() {
            if (!drawingMode) {
                console.log("CLEARED SELECTION unlocking pan");
                huddleCanvas.panUnlock();
            }
        });

        fabricCanvas.on('path:created', function(e) {
            var pathCreated = e.path;
            pathCreated.set({
                selectable: pathsSelectable,
                strokeWidth: $("#stroke-select").val(),
                hasControls: pathsSelectable,
                hasRotatingPoint: pathsSelectable
            });
            var collectionPath = getPathObjectForCollection(pathCreated);
            var pathId = CanvasPaths.insert({
                path: collectionPath
            });
            //console.log("ON DRAW -- ID: " + pathId + " || left: " + pathCreated.left + " || top: " + pathCreated.top);
            pathsAlreadyRendered.push(pathId);
            //console.log(CanvasPaths.find().fetch());
            //console.log(pathCreated);
            addPathEvents(pathCreated, pathId);
        });

        Deps.autorun(function() {
            var paths = CanvasPaths.find().fetch();
            //console.log("Alredy Rendered paths: " + pathsAlreadyRendered);
            for (var i = 0; i < paths.length; i++) {
                if (_.contains(pathsAlreadyRendered, paths[i]._id)) {
                    //console.log(pathsAlreadyRendered + " contains " + paths[i]._id + " therefore already rendered");
                    //do nothing if the path is already rendered
                } else {
                    var path = new fabric.Path(paths[i].path.coords);
                    path.set({
                        left: paths[i].path.positionLeft,
                        top: paths[i].path.positionTop,
                        fill: paths[i].path.fill,
                        stroke: paths[i].path.stroke,
                        strokeLineCap: paths[i].path.strokeLineCap,
                        strokeLineJoin: paths[i].path.strokeLineJoin,
                        strokeWidth: paths[i].path.strokeWidth,
                        pathOffset: {
                            x: paths[i].path.pathOffsetX,
                            y: paths[i].path.pathOffsetY
                        },
                        originX: paths[i].path.originX,
                        originY: paths[i].path.originY,
                        selectable: pathsSelectable,
                        hasControls: pathsSelectable,
                        hasRotatingPoint: pathsSelectable
                    });
                    addPathEvents(path, paths[i]._id);
                    //console.log("ON COLLECTION RENDER -- ID: " + paths[i]._id + " || left: " + paths[i].path.position.left + " || top: " + paths[i].path.position.top);
                    fabricCanvas.add(path);
                    //console.log(paths[i]);
                    pathsAlreadyRendered.push(paths[i]._id);
                }
            }

        });

        $("#stroke-select").change(function() {
            var strokeWidth = $(this).val();
            console.log(strokeWidth);
            fabricCanvas.freeDrawingBrush.width = strokeWidth;
            $("#stroke-value").html("STROKE WIDTH: " + strokeWidth);

        });

    }




}