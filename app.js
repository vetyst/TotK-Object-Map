window.addEventListener('load', (event) => {
    var map = L.map('totk-map', {
        preferCanvas: true,
        minZoom: -4,
        maxZoom: 4,
        center: [0, 0],
        zoom: -4,
        cursor: true,
        crs: L.CRS.Simple,
    });

    let groups = [];
    let activeType = '';
    let leftBottom = map.unproject([-6000, 5000], 0);
    let topRight = map.unproject([6000, -5000], 0);
    let bounds = new L.LatLngBounds(leftBottom, topRight);
    map.setMaxBounds(bounds);

    let skyOverlay = L.imageOverlay('images/maps/sky.jpg', bounds);
    let surfaceOverlay = L.imageOverlay('images/maps/surface.jpg', bounds);
    let caveOverlay = L.imageOverlay('images/maps/surface.jpg', bounds);
    let depthsOverlay = L.imageOverlay('images/maps/depths.jpg', bounds);

    jQuery('#showSky').click(function () {
        if (activeType === 'sky') {
            return;
        }

        skyOverlay.addTo(map);
        map.removeLayer(surfaceOverlay);
        map.removeLayer(caveOverlay);
        map.removeLayer(depthsOverlay);

        activateType('sky');
    });

    jQuery('#showSurface').click(function () {
        if (activeType === 'surface') {
            return;
        }

        map.removeLayer(skyOverlay);
        surfaceOverlay.addTo(map);
        map.removeLayer(caveOverlay);
        map.removeLayer(depthsOverlay);

        activateType('surface');
    }).trigger('click');

    jQuery('#showCave').click(function () {
        if (activeType === 'cave') {
            return;
        }

        map.removeLayer(skyOverlay);
        map.removeLayer(surfaceOverlay);
        caveOverlay.addTo(map);
        map.removeLayer(depthsOverlay);

        activateType('cave');
    });

    jQuery('#showDepths').click(function () {
        if (activeType === 'depths') {
            return;
        }

        map.removeLayer(skyOverlay);
        map.removeLayer(surfaceOverlay);
        map.removeLayer(caveOverlay);
        depthsOverlay.addTo(map);

        activateType('depths');
    });

    function activateType(type) {
        activeType = type;

        resetAll();

        jQuery('#itemFilters div:not(.' + activeType + ')').hide();
        jQuery('#itemFilters div.' + activeType).show();

        if (groups[type]) {
            return;
        }

        jQuery.getJSON('data/' + activeType + '.json', function (data) {
            parseData(type, data);
        });
    }

    function parseData(type, data) {
        groups[type] = data;

        Object.entries(data).forEach(function (group, index) {
            let displayName = group[1].name;

            if (displayName && displayName.length > 0) {
                displayName += '<span class="smaller-name">';
                displayName += ' - ';
            }

            let searchName = group[1].name + " " + group[0];

            displayName += group[0];
            displayName += '</span>';

            jQuery('#itemFilters .' + type).append('<label><input type="checkbox" value="' + group[0] + '" data-search-value="' + searchName + '">' + displayName + '</label>');
        });

        jQuery(document).on('change', '#itemFilters .' + type + ' input', function (e) {
            let val = jQuery(this).val();

            if (groups[type][val].markers) {
                if (this.checked === false) {
                    map.removeLayer(groups[type][val].markers);
                } else {
                    map.addLayer(groups[type][val].markers);
                }
            } else {
                groups[type][val].markers = L.markerClusterGroup({
                    removeOutsideVisibleBounds: true,
                    spiderfyOnMaxZoom: false,
                    disableClusteringAtZoom: 0,
                    animate: false,
                    maxClusterRadius: 20,
                    iconCreateFunction: function (cluster) {
                        return L.divIcon({
                            html: cluster.getChildCount(),
                            className: 'big-marker',
                            iconSize: [18, 18],
                        });
                    }
                });

                let displayName = groups[type][val].name

                if (displayName && displayName.length > 0) {
                    displayName += '<span class="smaller-name">';
                }

                displayName += val;
                displayName += '</span>';

                let iconsHtml = '';
                if (groups[type][val].icons.length > 0) {
                    iconsHtml += "<div class='totk-marker-icons'>";

                    groups[type][val].icons.forEach(function (icon, index) {
                        let fileEnd = 'png';
                        if (icon.includes('_Icon')) {
                            fileEnd = 'jpg';
                        }

                        iconsHtml += "<img src='images/icons/" + icon + "." + fileEnd + "' alt='" + icon + "'>"
                    });

                    iconsHtml += "</div>";
                }

                groups[type][val].locations.forEach(function (point, index) {
                    let marker = L.circleMarker([point.x, point.y], {
                        title: point.z + ' - ' + val,
                        radius: 3
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

                    groups[type][val].markers.addLayer(marker);
                });

                groups[type][val].markers.addTo(map);
            }
        });
    }

    jQuery('#filter-search input[type=search]').on('keyup', function () {
        if (this.value.length === 0) {
            jQuery('#itemFilters .' + activeType + ' label').show();
            return;
        }

        jQuery('#itemFilters .' + activeType + ' input[data-search-value*="' + this.value + '" i]').parent().show();
        jQuery('#itemFilters .' + activeType + ' input:not([data-search-value*="' + this.value + '" i])').parent().hide();
    });

    function resetAll() {
        jQuery('#itemFilters input:checked').trigger('click');
    }

    jQuery('#resetAll').click(resetAll);

    jQuery('#showAll').click(function () {
        jQuery('#itemFilters input:not(:checked):visible').trigger('click');
    });

    jQuery('#hideAll').click(function () {
        jQuery('#itemFilters input:checked:visible').trigger('click');
    });
});
