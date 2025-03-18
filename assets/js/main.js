// main.js - Main application initialization
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the map
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
                toastContainer.removeChild(toast);
            }, 300);
        }, duration);
    };

    // Function to generate details panel HTML
    window.generateDetailsPanelHTML = function (project) {
        const props = project.properties;

        // Format budget as currency
        const formattedBudget = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(props.budget);

        // Create highlights HTML if available
        let highlightsHTML = '';
        if (props.highlights && props.highlights.length) {
            highlightsHTML = `
        <div class="details-section">
          <h3>Project Highlights</h3>
          <ul>
            ${props.highlights.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
      `;
        }

        return `
      <div class="details-header" style="background-image: url('${props.imageUrl || 'assets/images/placeholder.jpg'}')">
        <button class="close-details">&times;</button>
        <div class="details-header-content">
          <h2>${props.name}</h2>
          <div class="project-meta">
            <span class="project-type">${props.type}</span>
            <span class="project-year">${props.year}</span>
            <span class="project-status status-${props.status.toLowerCase()}">${props.status}</span>
          </div>
        </div>
      </div>

      <div class="details-body">
        <div class="details-section">
          <h3>Overview</h3>
          <p>${props.description}</p>
        </div>

        <div class="details-section">
          <h3>Project Details</h3>
          <p><strong>Location:</strong> ${props.address}</p>
          <p><strong>Client:</strong> ${props.client}</p>
          <p><strong>Budget:</strong> ${formattedBudget}</p>
          <p><strong>Completion:</strong> ${props.status === 'Completed' ? `${props.year}` : 'In Progress'}</p>
        </div>

        ${highlightsHTML}

        <div class="details-section">
          <h3>Gallery</h3>
          <div class="details-gallery">
            <div class="gallery-item">
              <img src="${props.imageUrl || 'assets/images/placeholder.jpg'}" alt="${props.name}">
            </div>
            <div class="gallery-item">
              <img src="assets/images/placeholder.jpg" alt="Project image">
            </div>
            <div class="gallery-item">
              <img src="assets/images/placeholder.jpg" alt="Project image">
            </div>
            <div class="gallery-item">
              <img src="assets/images/placeholder.jpg" alt="Project image">
            </div>
          </div>
        </div>
      </div>

      <div class="details-footer">
        <button class="btn btn-primary close-panel">Close</button>
        <button class="btn-text btn-share" data-project-id="${props.id}">Share Project</button>
      </div>
    `;
    };
});

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
                yearSlider.value = `${yearSlider.min},${yearSlider.max}`;
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

    // Close details panel
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('close-details') || e.target.classList.contains('close-panel')) {
            const detailsPanel = document.getElementById('project-details-panel');
            if (detailsPanel) {
                detailsPanel.classList.remove('active');
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
}