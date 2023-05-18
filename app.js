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

    let leftBottom = map.unproject([-6000, 5000], 0);
    let topRight = map.unproject([6000, -5000], 0);
    let bounds = new L.LatLngBounds(leftBottom, topRight);

    L.imageOverlay('images/maps/01.jpg', bounds).addTo(map);

    map.setMaxBounds(bounds);

    jQuery.getJSON("data.json", function (groups) {
        window.groups = groups;
        var groups2 = groups;

        groups = Object.entries(groups);

        groups.forEach(function (group, index) {
            jQuery('#itemFilters').append('<label><input type="checkbox" name="groupFilters[' + group[0] + ']" value="' + group[0] + '">' + group[1].name + ' (' + group[1].locations.length + ')</label>');
        });

        jQuery(document).on('change', 'input[name^="groupFilters"]', function (e) {
            let val = jQuery(this).val();

            if (groups2[val].markers) {
                if (this.checked === false) {
                    map.removeLayer(groups2[val].markers);
                } else {
                    map.addLayer(groups2[val].markers);
                }
            } else {
                groups2[val].markers = L.markerClusterGroup({
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

                groups2[val].locations.forEach(function (point, index) {
                    let marker = L.circleMarker([0 - point.x, point.y], {
                        title: point.z + ' - ' + val,
                        radius: 3
                    });

                    marker.bindPopup(groups2[val].name);

                    groups2[val].markers.addLayer(marker);
                });

                groups2[val].markers.addTo(map);
            }
        });
    });

    jQuery('#itemFilterSearch').on('keyup', function () {
        if (this.value.length === 0) {
            jQuery('#itemFilters label').show();
            return;
        }

        jQuery('#itemFilters input[value*=' + this.value + ']').parent().show();
        jQuery('#itemFilters input:not([value*=' + this.value + '])').parent().hide();
    });

    jQuery('#clearSelections').click(function () {
        jQuery('#itemFilters input:checked').trigger('click');
    })
});
