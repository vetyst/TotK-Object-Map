window.addEventListener('load', (event) => {
    var map = L.map('map', {
        preferCanvas: true,
        minZoom: -4,
        maxZoom: 4,
        center: [0, 0],
        zoom: -4,
        cursor: true,
        crs: L.CRS.Simple,
        background: '#ff0000'
    });

    let leftBottom = map.unproject([-6000, 5000], 0);
    let topRight = map.unproject([6000, -5000], 0);
    let bounds = new L.LatLngBounds(leftBottom, topRight);

    L.imageOverlay('images/maps/01.jpg', bounds).addTo(map);

    map.setMaxBounds(bounds);

    jQuery.getJSON("data.json", function (groups) {
        window.groups = groups;
        groups2 = groups;
        groups = Object.entries(groups);

        groups.forEach(function (group, index) {
            jQuery('#itemFilters').append('<label><input type="checkbox" name="groupFilters[' + group[0] + ']" value="'+group[0]+'">' + group[1].name + ' (' + group[1].locations.length + ')</label>');
        });

        jQuery(document).on('change', 'input[name^="groupFilters"]', function(e) {
            console.log('changed');
            console.log();

            let val = jQuery(this).val()

            groups2[val].locations.forEach(function(point, index) {
                L.circleMarker([0 - point.x, point.y], {title:  point.z + ' - ' + val, radius: 3}).addTo(map);
            });
        });
    });
});
