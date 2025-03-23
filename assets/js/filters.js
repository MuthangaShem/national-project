class ProjectFilters {
    constructor(map, projectData) {
        this.map = map;
        this.projectData = projectData;
        this.markers = []; // Store all active markers for cleanup
        this.activeFilters = {
            type: ['Residential', 'Commercial', 'Transportation', 'Industrial'],
            status: ['Completed', 'In Progress', 'Planned'],
            yearRange: 2025, // Default to showing all projects up to the maximum year
            searchTerm: ''
        };

        this.initFilterListeners();

        // Apply initial filters
        this.applyFilters();
    }

    initFilterListeners() {
        // Type filter checkboxes
        document.querySelectorAll('.filter-type input').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateTypeFilters();
            });
        });

        // Status filter checkboxes
        document.querySelectorAll('.filter-status input').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateStatusFilters();
            });
        });

        // Year range slider
        const yearSlider = document.getElementById('year-range');
        if (yearSlider) {
            yearSlider.addEventListener('input', (e) => {
                // Update the year display
                const yearDisplay = document.getElementById('year-value');
                if (yearDisplay) {
                    yearDisplay.textContent = e.target.value;
                }

                this.activeFilters.yearRange = parseInt(e.target.value);
                this.applyFilters();
            });
        }

        // Search input with debounce
        const searchInput = document.getElementById('project-search');
        if (searchInput) {
            let debounceTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimeout);
                debounceTimeout = setTimeout(() => {
                    this.activeFilters.searchTerm = e.target.value.toLowerCase();
                    this.applyFilters();
                }, 300); // Debounce for 300ms
            });
        }
    }

    updateTypeFilters() {
        this.activeFilters.type = Array.from(
            document.querySelectorAll('.filter-type input:checked')
        ).map(el => el.value);
        this.applyFilters();
    }

    updateStatusFilters() {
        this.activeFilters.status = Array.from(
            document.querySelectorAll('.filter-status input:checked')
        ).map(el => el.value);
        this.applyFilters();
    }

    resetFilters() {
        // Reset filter values
        this.activeFilters = {
            type: ['Residential', 'Commercial', 'Transportation', 'Industrial'],
            status: ['Completed', 'In Progress', 'Planned'],
            yearRange: 2025,
            searchTerm: ''
        };

        // Update UI elements to match reset state
        document.querySelectorAll('.filter-type input, .filter-status input').forEach(checkbox => {
            checkbox.checked = true;
        });

        const yearSlider = document.getElementById('year-range');
        if (yearSlider) {
            yearSlider.value = 2025; // Set to max year

            const yearDisplay = document.getElementById('year-value');
            if (yearDisplay) {
                yearDisplay.textContent = yearSlider.value;
            }
        }

        const searchInput = document.getElementById('project-search');
        if (searchInput) {
            searchInput.value = '';
        }

        // Apply the reset filters
        this.applyFilters();
    }

    applyFilters() {
        // First, properly remove all existing markers
        this.clearAllMarkers();

        // If using clustered approach with GeoJSON source, update the source instead
        if (this.isUsingGeoJSONSource()) {
            this.updateGeoJSONSource();
            return;
        }

        // Otherwise use the individual markers approach
        this.applyMarkerFilters();
    }

    /**
     * Check if the map is using a GeoJSON source for clusters
     */
    isUsingGeoJSONSource() {
        try {
            return !!this.map.getSource('projects');
        } catch (e) {
            return false;
        }
    }

    /**
     * Update the GeoJSON source with filtered data
     */
    updateGeoJSONSource() {
        const filteredFeatures = this.getFilteredFeatures();

        // Create filtered GeoJSON
        const filteredGeoJSON = {
            type: 'FeatureCollection',
            features: filteredFeatures
        };

        // Update project count in UI
        this.updateProjectCount(filteredFeatures.length);

        // Update the source data
        try {
            this.map.getSource('projects').setData(filteredGeoJSON);
        } catch (e) {
            console.error('Error updating GeoJSON source:', e);
        }
    }

    /**
     * Apply filters with individual markers approach
     */
    applyMarkerFilters() {
        const filteredFeatures = this.getFilteredFeatures();

        // Update project count in UI
        this.updateProjectCount(filteredFeatures.length);

        // Create markers for filtered features
        filteredFeatures.forEach(feature => {
            // Create marker using the global function from markers.js
            if (typeof createCustomMarker === 'function') {
                const marker = createCustomMarker(feature);

                // Add popup if the function exists
                if (typeof createCustomPopup === 'function') {
                    marker.setPopup(createCustomPopup(feature));
                }

                // Add to map
                marker.addTo(this.map);

                // Store reference for later cleanup
                this.markers.push(marker);
            }
        });

        // Fit map to markers if we have any
        if (filteredFeatures.length > 0) {
            this.fitToFilteredMarkers(filteredFeatures);
        }
    }

    /**
     * Get features that match the current filters
     */
    getFilteredFeatures() {
        return this.projectData.features.filter(feature => {
            const props = feature.properties;

            // Filter by type
            if (this.activeFilters.type.length > 0 &&
                !this.activeFilters.type.includes(props.type)) {
                return false;
            }

            // Filter by status
            if (this.activeFilters.status.length > 0 &&
                !this.activeFilters.status.includes(props.status)) {
                return false;
            }

            // Filter by year (show projects up to the selected year)
            if (props.year > this.activeFilters.yearRange) {
                return false;
            }

            // Filter by search term
            if (this.activeFilters.searchTerm &&
                !props.name.toLowerCase().includes(this.activeFilters.searchTerm) &&
                !props.address.toLowerCase().includes(this.activeFilters.searchTerm)) {
                return false;
            }

            return true;
        });
    }

    /**
     * Clear all markers from the map
     */
    clearAllMarkers() {
        // Remove all markers from the map
        this.markers.forEach(marker => {
            if (marker) marker.remove();
        });

        // Reset markers array
        this.markers = [];
    }

    /**
     * Update the project count in the UI
     */
    updateProjectCount(count) {
        const projectCount = document.getElementById('project-count');
        if (projectCount) {
            projectCount.textContent = count;
        }
    }

    /**
     * Fit the map to the filtered markers
     */
    fitToFilteredMarkers(filteredFeatures) {
        if (filteredFeatures.length === 0) return;

        // Create a bounds object
        const bounds = new mapboxgl.LngLatBounds();

        // Extend the bounds to include all filtered markers
        filteredFeatures.forEach(feature => {
            bounds.extend(feature.geometry.coordinates);
        });

        // Fit the map to the bounds with some padding
        this.map.fitBounds(bounds, {
            padding: 50,
            maxZoom: 12 // Limit zoom level to avoid zooming too far in
        });
    }
}

// Export the class if using modules
if (typeof module !== 'undefined') {
    module.exports = { ProjectFilters };
}