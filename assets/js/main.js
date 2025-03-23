// Main application initialization
document.addEventListener('DOMContentLoaded', () => {
    // Check if config.js is loaded
    if (typeof config === 'undefined' || !config.mapboxAccessToken) {
        console.error('Mapbox access token not found. Please check config.js is properly set up.');
        showError('Configuration error. Please contact the administrator.');
        return;
    }

    // Initialize the map
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
        console.error('Map container not found');
        return;
    }

    // Create the map instance using the ProjectMap class
    const projectMap = new ProjectMap('map', {
        initialCenter: [-98.5795, 39.8283], // US center
        initialZoom: 3.5,
        mapStyle: 'mapbox://styles/mapbox/light-v11'
    });

    // Initialize UI event listeners
    initializeUI();

    // Helper function to show toast notifications
    window.showToast = function (message, duration = 3000) {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;

        toastContainer.appendChild(toast);

        // Remove toast after duration
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';

            // Remove from DOM after animation
            setTimeout(() => {
                if (toastContainer.contains(toast)) {
                    toastContainer.removeChild(toast);
                }
            }, 300);
        }, duration);
    };

    // Helper function to show errors
    function showError(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.innerHTML = `
      <div class="error-content">
        <h3>Error</h3>
        <p>${message}</p>
      </div>
    `;
        document.body.appendChild(errorElement);
    }

    // Animate a marker by project ID
    window.animateMarker = function (projectId) {
        if (!window.projectData || !window.mapInstance) return;

        // Find the project
        const project = window.projectData.features.find(f => f.properties.id === projectId);
        if (!project) return;

        // Create a pulsing dot at the project location
        const el = document.createElement('div');
        el.className = 'marker-highlight';

        // Add the temporary marker
        const marker = new mapboxgl.Marker({
            element: el,
            anchor: 'center'
        })
            .setLngLat(project.geometry.coordinates)
            .addTo(window.mapInstance);

        // Remove the marker after animation completes
        setTimeout(() => {
            marker.remove();
        }, 3000);
    };
});

// Adjust UI elements based on screen size
function adjustUIForScreenSize() {
    const isMobile = window.innerWidth <= 768;
    const sidebar = document.querySelector('.sidebar');

    if (sidebar) {
        // On mobile, sidebar should be hidden by default
        if (isMobile) {
            sidebar.classList.remove('active');
        } else {
            // On desktop, sidebar should be visible by default
            sidebar.classList.add('active');
        }
    }

    // Adjust map controls position based on screen size
    if (window.mapInstance) {
        // Example: adjust map padding to account for sidebar
        if (!isMobile) {
            window.mapInstance.setPadding({ left: 320, top: 0, right: 0, bottom: 0 });
        } else {
            window.mapInstance.setPadding({ left: 0, top: 0, right: 0, bottom: 0 });
        }
    }
}

// Initialize UI event listeners
function initializeUI() {
    // Toggle sidebar
    const toggleSidebarBtn = document.getElementById('toggle-sidebar');
    const sidebar = document.querySelector('.sidebar');

    if (toggleSidebarBtn && sidebar) {
        toggleSidebarBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }

    // Clear all filters
    const clearFiltersBtn = document.getElementById('clear-filters');

    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            // Reset all filter checkboxes to checked
            document.querySelectorAll('.filter-type input, .filter-status input').forEach(checkbox => {
                checkbox.checked = true;
            });

            // Reset year range slider
            const yearSlider = document.getElementById('year-range');
            if (yearSlider) {
                yearSlider.value = yearSlider.max;

                const yearValue = document.getElementById('year-value');
                if (yearValue) {
                    yearValue.textContent = yearSlider.value;
                }
            }

            // Clear search input
            const searchInput = document.getElementById('project-search');
            if (searchInput) {
                searchInput.value = '';
            }

            // Trigger filter update
            if (window.projectFilters) {
                window.projectFilters.resetFilters();
            }
        });
    }

    // Handle marker click events - delegate to document since markers may be dynamically added
    document.addEventListener('click', (e) => {
        // Check if the click was on a marker popup button
        if (e.target.closest('.popup-actions .btn-details')) {
            const projectId = e.target.closest('.btn-details').getAttribute('data-project-id');
            if (projectId && window.showProjectDetails) {
                window.showProjectDetails(projectId);
            }
        }
    });

    // About modal
    const aboutLink = document.getElementById('about-link');
    const aboutModal = document.getElementById('about-modal');
    const closeModalBtns = document.querySelectorAll('.close-modal');

    if (aboutLink && aboutModal) {
        aboutLink.addEventListener('click', (e) => {
            e.preventDefault();
            aboutModal.classList.add('active');
        });

        closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                aboutModal.classList.remove('active');
            });
        });

        // Close modal when clicking outside
        aboutModal.addEventListener('click', (e) => {
            if (e.target === aboutModal) {
                aboutModal.classList.remove('active');
            }
        });
    }

    // Year range slider value display
    const yearSlider = document.getElementById('year-range');
    const yearValue = document.getElementById('year-value');

    if (yearSlider && yearValue) {
        yearSlider.addEventListener('input', () => {
            yearValue.textContent = yearSlider.value;
        });
    }

    // Initialize keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // ESC key to close any open panels/modals
        if (e.key === 'Escape') {
            // Close details panel if open
            if (window.detailsPanel && window.detailsPanel.isOpen) {
                window.detailsPanel.closePanel();
                return;
            }

            // Close about modal if open
            const aboutModal = document.getElementById('about-modal');
            if (aboutModal && aboutModal.classList.contains('active')) {
                aboutModal.classList.remove('active');
                return;
            }

            // Close sidebar on mobile if open
            const sidebar = document.querySelector('.sidebar');
            if (sidebar && window.innerWidth <= 768 && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
            }
        }
    });

    // Handle window resize events
    window.addEventListener('resize', () => {
        // Adjust UI elements based on screen size
        adjustUIForScreenSize();
    });

    // Initial UI adjustment based on screen size
    adjustUIForScreenSize();
}