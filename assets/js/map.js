// map.js - Map initialization and control
class ProjectMap {
    /**
     * Initialize the map and its components
     * @param {string} containerId - The ID of the HTML element to contain the map
     * @param {Object} options - Configuration options for the map
     */
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

    /**
     * Initialize the Mapbox map
     */
    initMap() {
        // Import access token from config.js
        try {
            mapboxgl.accessToken = config.mapboxAccessToken;
        } catch (e) {
            console.error('Error accessing mapbox access token. Make sure config.js is set up correctly.');
            return;
        }

        this.map = new mapboxgl.Map({
            container: this.containerId,
            style: this.options.mapStyle,
            center: this.options.initialCenter,
            zoom: this.options.initialZoom,
            minZoom: this.options.minZoom,
            maxZoom: this.options.maxZoom
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

        // Make map instance globally available
        window.mapInstance = this.map;
    }

    /**
     * Handle map loaded event
     */
    onMapLoaded() {
        // Load project data
        this.loadProjectData();

        // Add custom event listeners
        this.addEventListeners();
    }

    /**
     * Load project data from GeoJSON file
     */
    loadProjectData() {
        fetch('assets/data/projects.geojson')
            .then(response => response.json())
            .then(data => {
                this.projectData = data;

                // Make data globally available
                window.projectData = data;

                if (this.options.clusterMarkers) {
                    this.addClusteredMarkers();
                } else {
                    this.addIndividualMarkers();
                }

                // Initialize filters
                if (typeof ProjectFilters === 'function') {
                    this.filters = new ProjectFilters(this.map, this.projectData);
                    window.projectFilters = this.filters;
                }

                // Initialize details panel if available
                if (typeof initDetailsPanel === 'function') {
                    initDetailsPanel(this.projectData, this.map);
                }

                // Check URL for direct project link
                this.checkUrlForProjectId();
            })
            .catch(error => {
                console.error('Error loading project data:', error);
                if (window.showToast) {
                    window.showToast('Failed to load project data. Please try again later.');
                }
            });
    }

    /**
     * Add clustered markers to the map
     */
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

        // Add event handlers for clusters and markers
        this.addClusterHandlers();
    }

    /**
     * Add event handlers for cluster and marker interactions
     */
    addClusterHandlers() {
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

            // Create popup content using the popup function if available
            const popupContent = typeof createCustomPopupHTML === 'function' ?
                createCustomPopupHTML(properties) :
                `<div><h3>${properties.name}</h3><p>${properties.description || ''}</p></div>`;

            // Ensure that if the map is zoomed out such that multiple
            // copies of the feature are visible, the popup appears
            // over the copy being pointed to.
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }

            new mapboxgl.Popup()
                .setLngLat(coordinates)
                .setHTML(popupContent)
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

    /**
     * Add individual markers for each project
     */
    addIndividualMarkers() {
        if (!this.projectData || !this.projectData.features) return;

        this.projectData.features.forEach(feature => {
            // Create marker if function is available
            if (typeof createCustomMarker === 'function') {
                const marker = createCustomMarker(feature);

                // Add popup if function is available
                if (typeof createCustomPopup === 'function') {
                    marker.setPopup(createCustomPopup(feature));
                }

                // Add to map
                marker.addTo(this.map);

                // Save reference to marker
                this.markers.push(marker);
            } else {
                // Fallback to basic marker
                const marker = new mapboxgl.Marker()
                    .setLngLat(feature.geometry.coordinates)
                    .addTo(this.map);

                this.markers.push(marker);
            }
        });
    }

    /**
     * Add general event listeners to the map
     */
    addEventListeners() {
        // Example: Add resize handler
        window.addEventListener('resize', () => {
            this.map.resize();
        });
    }

    /**
     * Fly to a specific project on the map
     * @param {string} projectId - ID of the project to fly to
     */
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
                if (typeof createCustomPopupHTML === 'function') {
                    new mapboxgl.Popup()
                        .setLngLat(feature.geometry.coordinates)
                        .setHTML(createCustomPopupHTML(feature.properties))
                        .addTo(this.map);
                }
            }, this.options.flyToDuration);
        }
    }

    /**
     * Fit the map view to show all projects
     */
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

    /**
     * Check URL for project ID parameter and fly to that project
     */
    checkUrlForProjectId() {
        // Check URL parameters for project ID
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('project');

        if (projectId) {
            setTimeout(() => {
                // If showProjectDetails is available, use it
                if (window.showProjectDetails) {
                    window.showProjectDetails(projectId, true);
                } else {
                    // Otherwise just fly to the project
                    this.flyToProject(projectId);
                }
            }, 1000);
        } else {
            // If no specific project, fit to all projects
            this.fitAllProjects();
        }
    }

    /**
     * Remove all markers from the map
     */
    removeAllMarkers() {
        if (this.markers && this.markers.length) {
            this.markers.forEach(marker => {
                if (marker) marker.remove();
            });
        }
        this.markers = [];
    }
}

// Export the class if using modules
if (typeof module !== 'undefined') {
    module.exports = { ProjectMap };
}