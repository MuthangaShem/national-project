// markers.js - Custom marker creation and handling

/**
 * Creates a custom marker for a project feature
 * @param {Object} feature - GeoJSON feature object representing a project
 * @returns {mapboxgl.Marker} - Mapbox GL marker object
 */
function createCustomMarker(feature) {
    // Extract properties from feature
    const props = feature.properties;
    const type = props.type;
    const status = props.status;
    const isFeatured = props.featured || false;

    // Create marker element
    const el = document.createElement('div');
    el.className = `marker marker-${type.toLowerCase()} status-${status.toLowerCase().replace(/\s+/g, '-')}`;

    // Add a tooltip with project name
    el.setAttribute('title', props.name);

    // Add animation for featured projects
    if (isFeatured) {
        el.classList.add('marker-pulse');
    }

    // Create and return the marker
    return new mapboxgl.Marker({
        element: el,
        anchor: 'bottom'
    }).setLngLat(feature.geometry.coordinates);
}

/**
 * Creates custom SVG marker elements for different project types
 * This function is used to preload marker icons if using custom SVGs instead of CSS
 */
function initializeMarkerIcons() {
    // Define project types and their colors
    const markerTypes = {
        'residential': '#ff8c00',
        'commercial': '#1e88e5',
        'transportation': '#43a047',
        'industrial': '#6a1b9a'
    };

    // Define status colors for status indicators
    const statusColors = {
        'completed': '#4caf50',
        'in-progress': '#ff9800',
        'planned': '#2196f3'
    };

    // Create a hidden container for marker SVGs if using custom SVGs
    const markerContainer = document.createElement('div');
    markerContainer.style.display = 'none';
    markerContainer.id = 'marker-icons';
    document.body.appendChild(markerContainer);

    // This would be used if you want to create custom SVG markers instead of CSS-styled divs
    // For each project type, create an SVG marker template
    Object.entries(markerTypes).forEach(([type, color]) => {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '30');
        svg.setAttribute('height', '40');
        svg.setAttribute('viewBox', '0 0 30 40');
        svg.id = `marker-${type}`;

        // Create the marker shape (example: simple pin)
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M15 2C8.4 2 3 7.4 3 14c0 5.3 5.3 14.2 12 24 6.7-9.8 12-18.7 12-24 0-6.6-5.4-12-12-12z');
        path.setAttribute('fill', color);
        path.setAttribute('stroke', 'white');
        path.setAttribute('stroke-width', '2');

        svg.appendChild(path);
        markerContainer.appendChild(svg);
    });
}

/**
 * Creates marker cluster layers for the map
 * @param {mapboxgl.Map} map - Mapbox GL map instance
 * @param {Object} sourceId - ID of the GeoJSON source containing project data
 */
function addMarkerClusters(map, sourceId = 'projects') {
    // Add cluster layer
    map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: sourceId,
        filter: ['has', 'point_count'],
        paint: {
            // Size based on cluster count
            'circle-radius': [
                'step',
                ['get', 'point_count'],
                20,  // Default size
                5,   // If count >= 5
                25,  // Size when count >= 5
                10,  // If count >= 10
                30,  // Size when count >= 10
                25,  // If count >= 25
                35   // Size when count >= 25
            ],
            // Color based on cluster count
            'circle-color': [
                'step',
                ['get', 'point_count'],
                '#52B0D8', // Color for count < 5
                5,
                '#4091C9', // Color for count 5-9
                10,
                '#2A6496', // Color for count 10-24
                25,
                '#173F5F'  // Color for count >= 25
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': 'white'
        }
    });

    // Add cluster count labels
    map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: sourceId,
        filter: ['has', 'point_count'],
        layout: {
            'text-field': '{point_count_abbreviated}',
            'text-size': 12,
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold']
        },
        paint: {
            'text-color': 'white'
        }
    });

    // Add individual project points for unclustered points
    map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: sourceId,
        filter: ['!', ['has', 'point_count']],
        paint: {
            'circle-radius': 8,
            'circle-color': [
                'match',
                ['get', 'type'],
                'Residential', '#ff8c00',
                'Commercial', '#1e88e5',
                'Transportation', '#43a047',
                'Industrial', '#6a1b9a',
        /* default */ '#888888'
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': 'white'
        }
    });
}

/**
 * Add event handlers for marker clusters
 * @param {mapboxgl.Map} map - Mapbox GL map instance
 * @param {Function} popupCallback - Function to call when creating a popup
 */
function addClusterHandlers(map, popupCallback) {
    // Handle clicks on clusters
    map.on('click', 'clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        const clusterId = features[0].properties.cluster_id;

        // Get the cluster expansion zoom level
        map.getSource('projects').getClusterExpansionZoom(
            clusterId,
            (err, zoom) => {
                if (err) return;

                // Fly to the cluster
                map.flyTo({
                    center: features[0].geometry.coordinates,
                    zoom: zoom
                });
            }
        );
    });

    // Handle clicks on individual points
    map.on('click', 'unclustered-point', (e) => {
        const coordinates = e.features[0].geometry.coordinates.slice();
        const properties = e.features[0].properties;

        // Create popup content
        const popupContent = popupCallback ?
            popupCallback(properties) :
            `<div><h3>${properties.name}</h3><p>${properties.description}</p></div>`;

        // Adjust point coordinates if the map is zoomed out
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        // Create and show popup
        new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(popupContent)
            .addTo(map);
    });

    // Change cursor on hover
    map.on('mouseenter', 'clusters', () => {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'clusters', () => {
        map.getCanvas().style.cursor = '';
    });

    map.on('mouseenter', 'unclustered-point', () => {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'unclustered-point', () => {
        map.getCanvas().style.cursor = '';
    });
}

/**
 * Animate a specific marker to draw attention to it
 * @param {mapboxgl.Marker} marker - The marker to animate
 * @param {string} animationType - Type of animation (pulse, bounce, etc.)
 */
function animateMarker(marker, animationType = 'pulse') {
    const el = marker.getElement();

    // Remove any existing animation classes
    el.classList.remove('marker-pulse', 'marker-bounce');

    // Add the requested animation class
    el.classList.add(`marker-${animationType}`);

    // Optional: remove the animation after a certain time
    setTimeout(() => {
        el.classList.remove(`marker-${animationType}`);
    }, 3000); // Stop animating after 3 seconds
}

/**
 * Create markers for all features in a GeoJSON collection
 * @param {Object} geojson - GeoJSON FeatureCollection
 * @param {mapboxgl.Map} map - Mapbox GL map instance
 * @param {Function} popupCallback - Function to call when creating a popup
 * @returns {Array} - Array of created markers
 */
function createMarkersFromGeoJSON(geojson, map, popupCallback) {
    const markers = [];

    geojson.features.forEach(feature => {
        // Create the marker
        const marker = createCustomMarker(feature);

        // Add popup if callback provided
        if (popupCallback) {
            marker.setPopup(
                new mapboxgl.Popup({ offset: 25 })
                    .setHTML(popupCallback(feature.properties))
            );
        }

        // Add to map
        marker.addTo(map);

        // Store reference to marker
        markers.push(marker);
    });

    return markers;
}

// Export functions for use in other files
if (typeof module !== 'undefined') {
    module.exports = {
        createCustomMarker,
        initializeMarkerIcons,
        addMarkerClusters,
        addClusterHandlers,
        animateMarker,
        createMarkersFromGeoJSON
    };
}