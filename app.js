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
            jQuery('#itemFilters .' + type).append('<label><input type="checkbox" value="' + group[0] + '" data-search-value="' + group[1].name + '">' + group[1].name + ' (' + group[1].locations.length + ')</label>');
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

                groups[type][val].locations.forEach(function (point, index) {
                    let marker = L.circleMarker([point.x, point.y], {
                        title: point.z + ' - ' + val,
                        radius: 3
                    });

                    marker.bindPopup(
                        "<div class='totk-marker'>" +
                        "   <h2>" + groups[type][val].name + "</h2>" +
                        "   <div class='totk-marker-meta'>" +
                        "      <span><strong>X: </strong>" + point.y + "</span>" +
                        "      <span><strong>Y: </strong>" + point.x + "</span>" +
                        "      <span><strong>Z: </strong>" + point.z + "</span>" +
                        "   </div>" +
                        "</div>"
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

        jQuery('#itemFilters .' + activeType + ' input[data-search-value*=' + this.value + ']').parent().show();
        jQuery('#itemFilters .' + activeType + ' input:not([data-search-value*=' + this.value + '])').parent().hide();
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
