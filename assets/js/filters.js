// filters.js
class ProjectFilters {
    constructor(map, projectData) {
        this.map = map;
        this.projectData = projectData;
        this.activeFilters = {
            type: [],
            status: [],
            yearRange: [2020, 2025],
            searchTerm: ''
        };

        this.initFilterListeners();
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
            yearSlider.addEventListener('change', (e) => {
                this.activeFilters.yearRange = [
                    parseInt(e.target.value.split(',')[0]),
                    parseInt(e.target.value.split(',')[1])
                ];
                this.applyFilters();
            });
        }

        // Search input
        const searchInput = document.getElementById('project-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.activeFilters.searchTerm = e.target.value.toLowerCase();
                this.applyFilters();
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

    applyFilters() {
        const filtered = this.projectData.features.filter(feature => {
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

            // Filter by year range
            if (props.year < this.activeFilters.yearRange[0] ||
                props.year > this.activeFilters.yearRange[1]) {
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

        // Update markers on map
        this.updateMapMarkers(filtered);

        // Update project count in UI
        document.getElementById('project-count').textContent = filtered.length;
    }

    updateMapMarkers(filteredFeatures) {
        // Clear existing markers
        if (this.markers) {
            this.markers.forEach(marker => marker.remove());
        }

        // Add filtered markers
        this.markers = filteredFeatures.map(feature => {
            return createCustomMarker(feature)
                .addTo(this.map)
                .setPopup(createCustomPopup(feature));
        });
    }
}