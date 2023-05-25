window.addEventListener('load', () => {
    var map = L.map('totk-map', {
        preferCanvas: true,
        minZoom: -4,
        maxZoom: 4,
        center: [0, 0],
        zoom: -4,
        cursor: true,
        crs: L.CRS.Simple,
    });

    var cursorMarker = L.marker();

    function updateLocations(){
        if (activeLayer !== 'surface') {
            map.removeLayer(zoomLayer1);
            map.removeLayer(zoomLayer2);
            return;
        }

        switch(map.getZoom()) {
            case -4:
            case -3:
                map.addLayer(zoomLayer1);
                map.removeLayer(zoomLayer2);
                break;
            case -2:
            case -1:
                map.removeLayer(zoomLayer1);
                map.addLayer(zoomLayer2);
                break;
        }
    }

    map.on('zoom', updateLocations)

    map.on('click', function (e) {
        cursorMarker
            .setLatLng(e.latlng)
            .bindPopup(
                "<div class='totk-marker'>" +
                "   <h2>Marker Positon</h2>" +
                "   <div class='content'>" +
                "       <div class='totk-marker-meta'>" +
                "          <span><strong>X: </strong>" + e.latlng.lng + "</span>" +
                "          <span><strong>Y: </strong>" + e.latlng.lat + "</span>" +
                "       </div>" +
                "   </div>" +
                "</div>"
            )
            .openPopup()
            .addTo(map);
    });

    window.lastIconClass = -1;

    let layers = [];
    let activeLayer = '';
    let leftBottom = map.unproject([-6000, 5000], 0);
    let topRight = map.unproject([6000, -5000], 0);
    let bounds = new L.LatLngBounds(leftBottom, topRight);
    map.setMaxBounds(bounds);

    let skyLayerBackgroundImage = L.imageOverlay('assets/images/maps/sky.jpg', bounds);
    let surfaceLayerBackgroundImage = L.imageOverlay('assets/images/maps/surface.jpg', bounds);
    let caveLayerBackgroundImage = L.imageOverlay('assets/images/maps/surface.jpg', bounds);
    let depthsLayerBackgroundImage = L.imageOverlay('assets/images/maps/depths.jpg', bounds);

    let zoomLayer1 = L.layerGroup();
    let zoomLayer2 = L.layerGroup();

    jQuery('#show-layer-sky').click(function () {
        if (activeLayer === 'sky') {
            return;
        }

        skyLayerBackgroundImage.addTo(map);
        map.removeLayer(surfaceLayerBackgroundImage);
        map.removeLayer(caveLayerBackgroundImage);
        map.removeLayer(depthsLayerBackgroundImage);

        activateLayer('sky');
    });

    jQuery.getJSON('data/locations.json', function (data) {
        jQuery(data.surface).each(function (idx, location) {
            if (location.name.length < 1 || location.locations.length < 1) {
                return;
            }

            jQuery(location.locations).each(function(idx, pos) {
                var tempToolTip = L.tooltip([pos.x, pos.y], {
                    className: 'locationArea',
                    content: location.name,
                    direction: 'center',
                    permanent: true,
                    sticky: true
                })
                    .openTooltip(map);

                if (location.raw.includes('MapRegion') === true) {
                    zoomLayer1.addLayer(tempToolTip);
                } else if (location.raw.includes('MapArea') === true) {
                    zoomLayer2.addLayer(tempToolTip);
                }
            });
        });

        zoomLayer1.addTo(map);
    });

    jQuery('#show-layer-surface').click(function () {
        if (activeLayer === 'surface') {
            return;
        }

        map.removeLayer(skyLayerBackgroundImage);
        surfaceLayerBackgroundImage.addTo(map);
        map.removeLayer(caveLayerBackgroundImage);
        map.removeLayer(depthsLayerBackgroundImage);

        activateLayer('surface');
    }).trigger('click');

    jQuery('#show-layer-cave').click(function () {
        if (activeLayer === 'cave') {
            return;
        }

        map.removeLayer(skyLayerBackgroundImage);
        map.removeLayer(surfaceLayerBackgroundImage);
        caveLayerBackgroundImage.addTo(map);
        map.removeLayer(depthsLayerBackgroundImage);

        activateLayer('cave');
    });

    jQuery('#show-layer-depths').click(function () {
        if (activeLayer === 'depths') {
            return;
        }

        map.removeLayer(skyLayerBackgroundImage);
        map.removeLayer(surfaceLayerBackgroundImage);
        map.removeLayer(caveLayerBackgroundImage);
        depthsLayerBackgroundImage.addTo(map);

        activateLayer('depths');
    });

    function activateLayer(layer) {
        activeLayer = layer;

        resetFilters();

        jQuery('#item-filters div:not(.' + activeLayer + ')').hide();
        jQuery('#item-filters div.' + activeLayer).show();

        if (layers[layer]) {
            return;
        }

        updateLocations();

        jQuery.getJSON('data/layers/' + activeLayer + '.json', function (data) {
            parseLayers(layer, data);
        });
    }

    function parseLayers(layer, data) {
        layers[layer] = data;

        markerHtml = '';
        Object.entries(data).forEach(function (markerGroup, index) {
            let displayName = markerGroup[1].name;

            if (displayName && displayName.length > 0) {
                displayName += '<span class="smaller-name">';
                displayName += ' - ';
            }

            let searchName = markerGroup[1].name + " " + markerGroup[0];

            displayName += markerGroup[0];
            displayName += '</span>';

            markerHtml += '<label><input type="checkbox" value="' + markerGroup[0] + '" data-search-value="' + searchName + '">' + displayName  + ' (' + markerGroup[1].locations.length + ')' + '</label>';
        });
        jQuery('#item-filters .' + layer).append(markerHtml);

        jQuery(document).on('change', '#item-filters .' + layer + ' input', function (e) {
            let val = jQuery(this).val();

            if (layers[layer][val].markers) {
                if (this.checked === false) {
                    map.removeLayer(layers[layer][val].markers);
                } else {
                    map.addLayer(layers[layer][val].markers);
                }
            } else {
                let iconClass = getIconClass();

                layers[layer][val].markers = L.markerClusterGroup({
                    removeOutsideVisibleBounds: true,
                    spiderfyOnMaxZoom: false,
                    disableClusteringAtZoom: 0,
                    animate: false,
                    maxClusterRadius: 20,
                    iconCreateFunction: function (cluster) {
                        return L.divIcon({
                            html: cluster.getChildCount(),
                            className: iconClass,
                            iconSize: [18, 18],
                        });
                    }
                });

                let displayName = layers[layer][val].name;

                if (displayName && displayName.length > 0) {
                    displayName += '<span class="smaller-name">';
                }

                displayName += val;
                displayName += '</span>';

                let iconsHtml = '';
                if (layers[layer][val].icons.length > 0) {
                    iconsHtml += "<div class='totk-marker-icons'>";

                    layers[layer][val].icons.forEach(function (icon, index) {
                        let fileEnd = 'png';
                        if (icon.includes('_Icon')) {
                            fileEnd = 'jpg';
                        }

                        iconsHtml += "<img src='assets/images/icons/" + icon + "." + fileEnd + "' alt='" + icon + "'>"
                    });

                    iconsHtml += "</div>";
                }

                layers[layer][val].locations.forEach(function (point, index) {
                    let marker = L.marker([point.x, point.y], {
                        icon: L.divIcon({className: iconClass}),
                        keyboard: false,
                        iconSize: [3, 3],
                        radius: 3,
                        title: point.z + ' - ' + val,
                    });

                    let popup =
                        "<div class='totk-marker'>" +
                        "   <h2>" + displayName + "</h2>" +
                        "   <div class='content'>" +
                        "       <div class='totk-marker-meta'>" +
                        "          <span><strong>X: </strong>" + point.y + "</span>" +
                        "          <span><strong>Y: </strong>" + point.x + "</span>" +
                        "          <span><strong>Z: </strong>" + point.z + "</span>" +
                        "       </div>" +
                        iconsHtml +
                        "   </div>" +
                        "</div>";

                    marker.bindPopup(
                        popup
                    );

                    layers[layer][val].markers.addLayer(marker);
                });

                layers[layer][val].markers.addTo(map);
            }
        });
    }

    jQuery('#filter-search input[type=search]').on('keyup', function () {
        if (this.value.length === 0) {
            jQuery('#item-filters .' + activeLayer + ' label').show();
            return;
        }

        jQuery('#item-filters .' + activeLayer + ' input[data-search-value*="' + this.value + '" i]').parent().show();
        jQuery('#item-filters .' + activeLayer + ' input:not([data-search-value*="' + this.value + '" i])').parent().hide();
    });

    function getIconClass() {
        window.lastIconClass++;
        if (window.lastIconClass > 12) {
            window.lastIconClass = 0;
        }

        return 'big-marker' + window.lastIconClass;
    }

    function resetFilters() {
        jQuery('#item-filters input:checked').trigger('click');
    }

    jQuery('#reset-filters').click(resetFilters);

    jQuery('#show-filtered-filters').click(function () {
        jQuery('#item-filters input:not(:checked):visible').trigger('click');
    });

    jQuery('#hide-filtered-filters').click(function () {
        jQuery('#item-filters input:checked:visible').trigger('click');
    });
});
