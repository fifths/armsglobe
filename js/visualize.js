function buildDataVizGeometries(linearData) {

    var loadLayer = document.getElementById('loading');

    for (var i in linearData) {
        var yearBin = linearData[i].data;

        var year = linearData[i].t;
        selectableYears.push(year);

        var count = 0;
        console.log('Building data for ...' + year);
        for (var s in yearBin) {
            var set = yearBin[s];

            //ningbo
            var exporterName = set.i.toUpperCase();
            //目的地
            var importerName = set.e.toUpperCase();

            exporter = countryData[exporterName];
            //console.log('exporter22333');
            //console.log(exporter);
            importer = countryData[importerName];

            //	we couldn't find the country, it wasn't in our list...
            if (exporter === undefined || importer === undefined)
                continue;

            //	visualize this event
            set.lineGeometry = makeConnectionLineGeometry(exporter, importer, set.v.TouristsCount, set.wc);

            // if( s % 1000 == 0 )
            // 	console.log( 'calculating ' + s + ' of ' + yearBin.length + ' in year ' + year);
        }

        //	use this break to only visualize one year (1992)
        // break;

        //	how to make this work?
        // loadLayer.innerHTML = 'loading data for ' + year + '...';
        // console.log(loadLayer.innerHTML);
    }

    loadLayer.style.display = 'none';
}

function getVisualizedMesh(linearData, year, countries, exportCategories, importCategories) {
    console.log(year);
    console.log('getVisualizedMesh');
    console.log(countries);
    console.log(exportCategories);
    console.log(importCategories);
    //	for comparison purposes, all caps the country names
    for (var i in countries) {
        countries[i] = countries[i].toUpperCase();
    }

    //年年
    //	pick out the year first from the data
    var year1 = parseInt((year + '').substr(0, 4));
    console.log('year1');
    console.log(year1);
    var month1 = parseInt((year + '').substr(4, 2));

    var year2 = parseInt((kyear + '').substr(0, 4));
    console.log('year2');
    console.log(year2);
    //var month2=parseInt(kyear.substr(4,6));

    var indexFromYear = (year1 - year2) * 12 + month1 - 1;
    /*if(year1-year2==0){
     var indexFromYear =month1-1 ;
     }else{
     }*/

    console.log('indexFromYear');
    console.log(indexFromYear);
    //var indexFromYear = parseInt(year) - kyear;

    /*if( indexFromYear >= timeBins.length )
    	indexFromYear = timeBins.length-1;*/

    var affectedCountries = [];

    var bin = linearData[indexFromYear].data;
    console.log(linearData[indexFromYear]);

    var linesGeo = new THREE.Geometry();
    var lineColors = [];

    var particlesGeo = new THREE.Geometry();
    var particleColors = [];

    // var careAboutExports = ( action === 'exports' );
    // var careAboutImports = ( action === 'imports' );
    // var careAboutBoth = ( action === 'both' );

    //	go through the data from year, and find all relevant geometries
    for (i in bin) {
        var set = bin[i];

        //	filter out countries we don't care about
        var exporterName = set.i.toUpperCase();
        var importerName = set.e.toUpperCase();
        var relevantExport = $.inArray(exporterName, countries) >= 0;
        var relevantImport = $.inArray(importerName, countries) >= 0;

        var useExporter = relevantExport;
        var useImporter = relevantImport;

        var categoryName = reverseWeaponLookup[set.wc];
        var relevantExportCategory = relevantExport && $.inArray(categoryName, exportCategories) >= 0;
        var relevantImportCategory = relevantImport && $.inArray(categoryName, importCategories) >= 0;

        if ((useImporter || useExporter) && (relevantExportCategory || relevantImportCategory)) {
            //	we may not have line geometry... (?)
            if (set.lineGeometry === undefined)
                continue;

            var thisLineIsExport = false;

            if (exporterName == selectedCountry.countryName) {
                thisLineIsExport = true;
            }

            var lineColor = thisLineIsExport ? new THREE.Color(exportColor) : new THREE.Color(importColor);

            var lastColor;
            //	grab the colors from the vertices
            for (s in set.lineGeometry.vertices) {
                var v = set.lineGeometry.vertices[s];
                lineColors.push(lineColor);
                lastColor = lineColor;
            }

            //	merge it all together
            THREE.GeometryUtils.merge(linesGeo, set.lineGeometry);

            var particleColor = lastColor.clone();
            var points = set.lineGeometry.vertices;
            var particleCount = Math.floor(set.v.TouristsCount / 0.02 / set.lineGeometry.vertices.length) + 1;
            particleCount = constrain(particleCount, 10, 100);
            var particleSize = set.lineGeometry.size;
            for (var s = 0; s < particleCount; s++) {
                // var rIndex = Math.floor( Math.random() * points.length );
                // var rIndex = Math.min(s,points.length-1);

                var desiredIndex = s / particleCount * points.length;
                var rIndex = constrain(Math.floor(desiredIndex), 0, points.length - 1);

                var point = points[rIndex];
                var particle = point.clone();
                particle.moveIndex = rIndex;
                particle.nextIndex = rIndex + 1;
                if (particle.nextIndex >= points.length)
                    particle.nextIndex = 0;
                particle.lerpN = 0;
                particle.path = points;
                particlesGeo.vertices.push(particle);
                particle.size = particleSize;
                particleColors.push(particleColor);
            }

            if ($.inArray(exporterName, affectedCountries) < 0) {
                affectedCountries.push(exporterName);
            }

            if ($.inArray(importerName, affectedCountries) < 0) {
                affectedCountries.push(importerName);
            }

            var vb = set.v.TouristsCount;
            var vb1 = set.v.OrderCount;
            //console.log('vb');
            //console.log(vb1);
            //console.log('vb1');
            //console.log(vb1);
            //console.log(countryData);

            var exporterCountry = countryData[exporterName];
            if (exporterCountry.mapColor === undefined) {
                exporterCountry.mapColor = vb;
            } else {
                exporterCountry.mapColor += vb;
            }
            //console.log('exporterCountry.mapColor');
            //console.log(exporterCountry.mapColor);

            var importerCountry = countryData[importerName];
            if (importerCountry.mapColor === undefined) {
                importerCountry.mapColor = vb;
            } else {
                importerCountry.mapColor += vb;
            }

            exporterCountry.exportedAmount += vb;
            importerCountry.importedAmount += vb;

            exporterCountry.exportedAmount1 += vb1;
            importerCountry.importedAmount1 += vb1;



            //console.log('selectedCountry');
            //console.log(selectedCountry);
            if (exporterCountry == selectedCountry) {
                selectedCountry.summary.exported[set.wc] += set.v.TouristsCount;
                selectedCountry.summary.exported.total += set.v.TouristsCount;

                selectedCountry.summary.exportsOrderCount[set.wc] += set.v.OrderCount;
                selectedCountry.summary.exportsOrderCount.total += set.v.OrderCount;
            }
            if (importerCountry == selectedCountry) {
                selectedCountry.summary.imported[set.wc] += set.v.TouristsCount;
                selectedCountry.summary.imported.total += set.v.TouristsCount;

                selectedCountry.summary.importsOrderCount[set.wc] += set.v.OrderCount;
                selectedCountry.summary.importsOrderCount.total += set.v.OrderCount;
            }

            if (importerCountry == selectedCountry || exporterCountry == selectedCountry) {
                selectedCountry.summary.total += set.v.TouristsCount;

                selectedCountry.summary.OrderCounttotal += set.v.OrderCount;
            }


        }
    }

    // console.log(selectedCountry);

    linesGeo.colors = lineColors;

    //	make a final mesh out of this composite
    /*var splineOutline = new THREE.Line( linesGeo, new THREE.LineBasicMaterial(
    	{ 	color: 0xffffff, opacity: 1.0, blending:
    		THREE.AdditiveBlending, transparent:true,
    		depthWrite: false, vertexColors: true,
    		linewidth: 1 } )
    );*/

    var material_m = new THREE.LineBasicMaterial({
        color: 0xffffff,
        opacity: 1.0,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        vertexColors: true,
        linewidth: 1
    });
    //THREE.LinePieces
    var splineOutline = new THREE.Line(linesGeo, material_m);





    splineOutline.renderDepth = false;


    attributes = {
        size: {
            type: 'f',
            value: []
        },
        customColor: {
            type: 'c',
            value: []
        }
    };

    uniforms = {
        amplitude: {
            type: "f",
            value: 1.0
        },
        color: {
            type: "c",
            value: new THREE.Color(0xffffff)
        },
        texture: {
            type: "t",
            value: 0,
            texture: THREE.ImageUtils.loadTexture("images/particleA.png")
        },
    };

    var shaderMaterial = new THREE.ShaderMaterial({

        uniforms: uniforms,
        attributes: attributes,
        vertexShader: document.getElementById('vertexshader').textContent,
        fragmentShader: document.getElementById('fragmentshader').textContent,

        blending: THREE.AdditiveBlending,
        depthTest: true,
        depthWrite: false,
        transparent: true,
        // sizeAttenuation: true,
    });



    var particleGraphic = THREE.ImageUtils.loadTexture("images/map_mask.png");
    var particleMat = new THREE.ParticleBasicMaterial({
        map: particleGraphic,
        color: 0xffffff,
        size: 60,
        blending: THREE.NormalBlending,
        transparent: true,
        depthWrite: false,
        vertexColors: true,
        sizeAttenuation: true
    });
    particlesGeo.colors = particleColors;
    var pSystem = new THREE.ParticleSystem(particlesGeo, shaderMaterial);
    pSystem.dynamic = true;
    splineOutline.add(pSystem);

    var vertices = pSystem.geometry.vertices;
    var values_size = attributes.size.value;
    var values_color = attributes.customColor.value;

    for (var v = 0; v < vertices.length; v++) {
        values_size[v] = pSystem.geometry.vertices[v].size;
        values_color[v] = particleColors[v];
    }

    pSystem.update = function() {
        // var time = Date.now()
        for (var i in this.geometry.vertices) {
            var particle = this.geometry.vertices[i];
            var path = particle.path;
            var moveLength = path.length;

            particle.lerpN += 0.05;
            if (particle.lerpN > 1) {
                particle.lerpN = 0;
                particle.moveIndex = particle.nextIndex;
                particle.nextIndex++;
                if (particle.nextIndex >= path.length) {
                    particle.moveIndex = 0;
                    particle.nextIndex = 1;
                }
            }

            var currentPoint = path[particle.moveIndex];
            var nextPoint = path[particle.nextIndex];


            particle.copy(currentPoint);
            particle.lerpSelf(nextPoint, particle.lerpN);
        }
        this.geometry.verticesNeedUpdate = true;
    };

    //	return this info as part of the mesh package, we'll use this in selectvisualization
    splineOutline.affectedCountries = affectedCountries;


    return splineOutline;
}

function selectVisualization(linearData, year, countries, exportCategories, importCategories) {
    console.log('选中');
    console.log('year');
    console.log(year);
    console.log('linearData');
    console.log(linearData);
    //console.log('exportCategories');
    //console.log(exportCategories);
    //console.log('importCategories');
    //console.log(importCategories);
    //	we're only doing one country for now so...
    var cName = countries[0].toUpperCase();
    //console.log('cName');
    //console.log(cName);
    $("#hudButtons .countryTextInput").val(cName);
    previouslySelectedCountry = selectedCountry;
    selectedCountry = countryData[countries[0].toUpperCase()];

    selectedCountry.summary = {
        imported: {
            mil: 0,
            civ: 0,
            ammo: 0,
            total: 0
        },
        exported: {
            mil: 0,
            civ: 0,
            ammo: 0,
            total: 0
        },
        exportsOrderCount: {
            mil: 0,
            civ: 0,
            ammo: 0,
            total: 0
        },
        importsOrderCount: {
            mil: 0,
            civ: 0,
            ammo: 0,
            total: 0
        },
        total: 0,
        historical: getHistoricalData(selectedCountry),
    };

    // console.log(selectedCountry);

    //	clear off the country's internally held color data we used from last highlight
    for (var i in countryData) {
        var country = countryData[i];
        country.exportedAmount = 0;
        country.importedAmount = 0;
        country.exportedAmount1 = 0;
        country.importedAmount1 = 0;
        country.mapColor = 0;
    }

    //	clear markers
    for (var i in selectableCountries) {
        removeMarkerFromCountry(selectableCountries[i]);
    }

    //	clear children
    while (visualizationMesh.children.length > 0) {
        var c = visualizationMesh.children[0];
        visualizationMesh.remove(c);
    }

    //	build the mesh
    console.time('getVisualizedMesh');
    var mesh = getVisualizedMesh(timeBins, year, countries, exportCategories, importCategories);
    //console.log(mesh);
    console.timeEnd('getVisualizedMesh');

    //	add it to scene graph
    visualizationMesh.add(mesh);


    //	alright we got no data but at least highlight the country we've selected
    if (mesh.affectedCountries.length == 0) {
        mesh.affectedCountries.push(cName);
    }

    //出去游玩
    for (var i in mesh.affectedCountries) {
        var countryName = mesh.affectedCountries[i];
        var country = countryData[countryName];
        //console.log('country.mapColor');
        //console.log(countryData);
        //console.log(country.mapColor);
        attachMarkerToCountry(countryName, country.mapColor);
    }

    // console.log( mesh.affectedCountries );
    highlightCountry(mesh.affectedCountries);

    if (previouslySelectedCountry !== selectedCountry) {
        if (selectedCountry) {
            rotateTargetX = selectedCountry.lat * Math.PI / 180;
            var targetY0 = -(selectedCountry.lon - 9) * Math.PI / 180;
            var piCounter = 0;
            while (true) {
                var targetY0Neg = targetY0 - Math.PI * 2 * piCounter;
                var targetY0Pos = targetY0 + Math.PI * 2 * piCounter;
                if (Math.abs(targetY0Neg - rotating.rotation.y) < Math.PI) {
                    rotateTargetY = targetY0Neg;
                    break;
                } else if (Math.abs(targetY0Pos - rotating.rotation.y) < Math.PI) {
                    rotateTargetY = targetY0Pos;
                    break;
                }
                piCounter++;
                rotateTargetY = wrap(targetY0, -Math.PI, Math.PI);
            }
            // console.log(rotateTargetY);
            //lines commented below source of rotation error
            //is there a more reliable way to ensure we don't rotate around the globe too much?
            /*
            if( Math.abs(rotateTargetY - rotating.rotation.y) > Math.PI )
            	rotateTargetY += Math.PI;
            */
            rotateVX *= 0.6;
            rotateVY *= 0.6;
        }
    }

    d3Graphs.initGraphs();
}
