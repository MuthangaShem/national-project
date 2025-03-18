import { config } from './config.js';

class ProjectMap {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.options = Object.assign({
            initialCenter: [-98.5795, 39.8283], // United States center
            initialZoom: 3.5,
            minZoom: 2,
            maxZoom: 16,
            mapStyle: 'mapbox://styles/mapbox/light-v11',
            clusterMarkers: true,
            flyToDuration: 1500,
            fitBoundsPadding: 100
        }, options);

        this.markers = [];
        this.filters = null;

        this.initMap();
    }

    initMap() {
        mapboxgl.accessToken = ''; // Replace with your token

        this.map = new mapboxgl.Map({
            container: this.containerId,
            style: this.options.mapStyle,
            center: this.options.initialCenter,
            zoom: this.options.initialZoom,
            minZoom: this.options.minZoom,
            maxZoom: this.options.maxZoom,
            accessToken: config.mapboxAccessToken // Use the API key from config
        });

        // Add navigation controls
        this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Add fullscreen control
        this.map.addControl(new mapboxgl.FullscreenControl(), 'top-right');

        // Add geolocation control
        this.map.addControl(new mapboxgl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: true
            },
            trackUserLocation: true
        }), 'top-right');

        // Initialize the map
        this.map.on('load', () => {
            this.onMapLoaded();
        });
    }

    onMapLoaded() {
        // Load project data
        this.loadProjectData();

        // Add custom event listeners
        this.addEventListeners();
    }

    loadProjectData() {
        fetch('assets/data/projects.geojson')
            .then(response => response.json())
            .then(data => {
                this.projectData = data;

                if (this.options.clusterMarkers) {
                    this.addClusteredMarkers();
                } else {
                    this.addIndividualMarkers();
                }

                // Initialize filters
                this.filters = new ProjectFilters(this.map, this.projectData);

                // Check URL for direct project link
                this.checkUrlForProjectId();
            })
            .catch(error => {
                console.error('Error loading project data:', error);
            });
    }

    addClusteredMarkers() {
        // Add source for clustered markers
        this.map.addSource('projects', {
            type: 'geojson',
            data: this.projectData,
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 50
        });

        // Add cluster circles
        this.map.addLayer({
            id: 'clusters',
            type: 'circle',
            source: 'projects',
            filter: ['has', 'point_count'],
            paint: {
                'circle-color': [
                    'step',
                    ['get', 'point_count'],
                    '#51bbd6', // Color for clusters with count < 10
                    10,
                    '#f1f075', // Color for clusters with count >= 10 and < 50
                    50,
                    '#f28cb1'  // Color for clusters with count >= 50
                ],
                'circle-radius': [
                    'step',
                    ['get', 'point_count'],
                    20,  // Radius for clusters with count < 10
                    10,
                    30,  // Radius for clusters with count >= 10 and < 50
                    50,
                    40   // Radius for clusters with count >= 50
                ]
            }
        });

        // Add cluster count labels
        this.map.addLayer({
            id: 'cluster-count',
            type: 'symbol',
            source: 'projects',
            filter: ['has', 'point_count'],
            layout: {
                'text-field': '{point_count_abbreviated}',
                'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                'text-size': 12
            }
        });

        // Add unclustered point markers
        this.map.addLayer({
            id: 'unclustered-point',
            type: 'circle',
            source: 'projects',
            filter: ['!', ['has', 'point_count']],
            paint: {
                'circle-color': [
                    'match',
                    ['get', 'type'],
                    'Residential', '#ff8c00',
                    'Commercial', '#1e88e5',
                    'Transportation', '#43a047',
                    'Industrial', '#6a1b9a',
          /* default */ '#888888'
                ],
                'circle-radius': 8,
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff'
            }
        });

        // Handle cluster click
        this.map.on('click', 'clusters', (e) => {
            const features = this.map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
            const clusterId = features[0].properties.cluster_id;

            this.map.getSource('projects').getClusterExpansionZoom(clusterId, (err, zoom) => {
                if (err) return;

                this.map.easeTo({
                    center: features[0].geometry.coordinates,
                    zoom: zoom
                });
            });
        });

        // Handle unclustered point click
        this.map.on('click', 'unclustered-point', (e) => {
            const coordinates = e.features[0].geometry.coordinates.slice();
            const properties = e.features[0].properties;

            // Create popup HTML
            const popupHTML = createCustomPopupHTML(properties);

            // Ensure that if the map is zoomed out such that multiple
            // copies of the feature are visible, the popup appears
            // over the copy being pointed to.
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }

            new mapboxgl.Popup()
                .setLngLat(coordinates)
                .setHTML(popupHTML)
                .addTo(this.map);
        });

        // Change cursor on hover
        this.map.on('mouseenter', 'clusters', () => {
            this.map.getCanvas().style.cursor = 'pointer';
        });

        this.map.on('mouseleave', 'clusters', () => {
            this.map.getCanvas().style.cursor = '';
        });

        this.map.on('mouseenter', 'unclustered-point', () => {
            this.map.getCanvas().style.cursor = 'pointer';
        });

        this.map.on('mouseleave', 'unclustered-point', () => {
            this.map.getCanvas().style.cursor = '';
        });
    }

    addIndividualMarkers() {
        this.projectData.features.forEach(feature => {
            // Create custom marker
            const marker = createCustomMarker(feature);

            // Add popup
            marker.setPopup(createCustomPopup(feature));

            // Add to map
            marker.addTo(this.map);

            // Save reference to marker
            this.markers.push(marker);
        });
    }

    addEventListeners() {
        // Example: Add resize handler
        window.addEventListener('resize', () => {
            this.map.resize();
        });
    }

    flyToProject(projectId) {
        const feature = this.projectData.features.find(f =>
            f.properties.id === projectId
        );

        if (feature) {
            this.map.flyTo({
                center: feature.geometry.coordinates,
                zoom: 14,
                duration: this.options.flyToDuration
            });

            // Create and open popup
            setTimeout(() => {
                new mapboxgl.Popup()
                    .setLngLat(feature.geometry.coordinates)
                    .setHTML(createCustomPopupHTML(feature.properties))
                    .addTo(this.map);
            }, this.options.flyToDuration);
        }
    }

    fitAllProjects() {
        if (!this.projectData || !this.projectData.features.length) return;

        // Create a bounds object
        const bounds = new mapboxgl.LngLatBounds();

        // Extend bounds with each project point
        this.projectData.features.forEach(feature => {
            bounds.extend(feature.geometry.coordinates);
        });

        // Fit map to bounds
        this.map.fitBounds(bounds, {
            padding: this.options.fitBoundsPadding
        });
    }

    checkUrlForProjectId() {
        // Check URL parameters for project ID
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('project');

        if (projectId) {
            setTimeout(() => {
                this.flyToProject(projectId);
            }, 1000);
        } else {
            // If no specific project, fit to all projects
            this.fitAllProjects();
        }
    }
}