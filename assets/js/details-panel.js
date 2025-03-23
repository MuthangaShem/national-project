// details-panel.js - Handles the project details panel functionality

/**
 * Project Details Panel Manager
 * Manages opening, closing, and populating the project details panel
 */
class DetailsPanel {
  /**
   * Initialize the details panel
   * @param {string} panelId - The ID of the panel element
   * @param {object} projectData - The project data object containing all projects
   * @param {object} mapInstance - Reference to the map instance for flyTo functionality
   */
  constructor(panelId = 'project-details-panel', projectData = null, mapInstance = null) {
    this.panelId = panelId;
    this.panel = document.getElementById(panelId);
    this.projectData = projectData;
    this.map = mapInstance;
    this.currentProject = null;
    this.isOpen = false;

    // Create overlay if it doesn't exist
    this.createOverlay();

    // Initialize event listeners
    this.initEventListeners();
  }

  /**
   * Create the background overlay element
   */
  createOverlay() {
    if (!document.querySelector('.app-overlay')) {
      const overlay = document.createElement('div');
      overlay.className = 'app-overlay';
      document.body.appendChild(overlay);

      // Add click event to close panel when clicking outside
      overlay.addEventListener('click', () => {
        this.closePanel();
      });

      this.overlay = overlay;
    } else {
      this.overlay = document.querySelector('.app-overlay');
    }
  }

  /**
   * Initialize event listeners for the panel
   */
  initEventListeners() {
    // Handle clicks inside the panel
    if (this.panel) {
      this.panel.addEventListener('click', (e) => {
        // Close button
        if (e.target.closest('.details-close') || e.target.closest('.btn-close-panel')) {
          e.preventDefault();
          this.closePanel();
        }

        // Share button
        if (e.target.closest('.btn-share-project')) {
          e.preventDefault();
          this.shareProject();
        }

        // Locate on map button
        if (e.target.closest('.btn-locate-project')) {
          e.preventDefault();
          this.locateOnMap();
        }
      });

      // Handle keyboard events
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.closePanel();
        }
      });
    }
  }

  /**
   * Open the details panel and display project information
   * @param {string} projectId - The ID of the project to display
   * @param {boolean} flyToMarker - Whether to fly to the marker on the map
   */
  openPanel(projectId, flyToMarker = false) {
    // Find the project in the project data
    const project = this.findProject(projectId);

    if (!project) {
      console.error(`Project with ID ${projectId} not found`);
      return;
    }

    // Store current project
    this.currentProject = project;

    // Create panel content
    this.populatePanel(project);

    // Show the panel
    this.panel.classList.add('active');
    this.overlay.classList.add('active');
    this.isOpen = true;

    // Prevent background scrolling
    document.body.style.overflow = 'hidden';

    // Fly to marker if requested
    if (flyToMarker && this.map) {
      this.map.flyTo({
        center: project.geometry.coordinates,
        zoom: 15,
        duration: 1000
      });
    }

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('panel:opened', {
      detail: { projectId }
    }));
  }

  /**
   * Close the details panel
   */
  closePanel() {
    this.panel.classList.remove('active');
    this.overlay.classList.remove('active');
    this.isOpen = false;

    // Restore scrolling
    document.body.style.overflow = '';

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('panel:closed'));

    // Clear content after animation completes
    setTimeout(() => {
      if (!this.isOpen) {
        this.panel.innerHTML = '';
      }
    }, 300);
  }

  /**
   * Find a project by its ID
   * @param {string} projectId - The ID of the project to find
   * @returns {object|null} - The project object or null if not found
   */
  findProject(projectId) {
    if (!this.projectData || !this.projectData.features) {
      console.error('Project data not loaded');
      return null;
    }

    return this.projectData.features.find(
      feature => feature.properties.id === projectId
    );
  }

  /**
   * Populate the panel with project information
   * @param {object} project - The project object to display
   */
  populatePanel(project) {
    const props = project.properties;

    // Format the budget as currency
    const formattedBudget = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(props.budget);

    // Format type and status classes for CSS
    const typeClass = `type-${props.type.toLowerCase()}`;
    const statusClass = `status-${props.status.toLowerCase().replace(/\s+/g, '-')}`;

    // Create the HTML content
    const html = `
      <div class="details-header" style="background-image: url('${props.imageUrl || 'assets/images/placeholder.jpg'}')">
        <button class="details-close" aria-label="Close panel">&times;</button>
        <div class="details-header-content">
          <h2>${props.name}</h2>
          <div class="details-meta">
            <span class="details-badge ${typeClass}">${props.type}</span>
            <span class="details-badge ${statusClass}">${props.status}</span>
          </div>
          <div class="details-meta">
            <div class="details-meta-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              ${props.address}
            </div>
            <div class="details-meta-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              ${props.year}
            </div>
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
          <table class="details-info-table">
            <tr>
              <th>Client</th>
              <td>${props.client}</td>
            </tr>
            <tr>
              <th>Project Type</th>
              <td>${props.type}${props.subtype ? ` - ${props.subtype}` : ''}</td>
            </tr>
            <tr>
              <th>Status</th>
              <td>${props.status}</td>
            </tr>
            <tr>
              <th>Year</th>
              <td>${props.year}</td>
            </tr>
            <tr>
              <th>Budget</th>
              <td>${formattedBudget}</td>
            </tr>
            <tr>
              <th>Location</th>
              <td>${props.address}</td>
            </tr>
          </table>
        </div>

        ${this.generateHighlightsHTML(props.highlights)}

        ${this.generateGalleryHTML(props)}

        <div class="details-actions">
          <button class="btn btn-primary btn-locate-project" data-project-id="${props.id}">
            Locate on Map
          </button>
          <button class="btn btn-secondary btn-share-project" data-project-id="${props.id}">
            Share Project
          </button>
        </div>
      </div>
    `;

    // Set the HTML to the panel
    this.panel.innerHTML = html;
  }

  /**
   * Generate HTML for project highlights if available
   * @param {Array} highlights - Array of highlight strings
   * @returns {string} - HTML for highlights section
   */
  generateHighlightsHTML(highlights) {
    if (!highlights || !highlights.length) {
      return '';
    }

    const highlightsItems = highlights.map(item => `<li>${item}</li>`).join('');

    return `
      <div class="details-section">
        <h3>Highlights</h3>
        <ul class="details-highlights">
          ${highlightsItems}
        </ul>
      </div>
    `;
  }

  /**
   * Generate HTML for the image gallery
   * @param {object} props - Project properties
   * @returns {string} - HTML for gallery section
   */
  generateGalleryHTML(props) {
    // In a real app, you would have multiple images
    // For now, we'll use the main image and placeholders
    return `
      <div class="details-section">
        <h3>Gallery</h3>
        <div class="details-gallery">
          <div class="gallery-item">
            <img src="${props.imageUrl || 'assets/images/placeholder.jpg'}" alt="${props.name}">
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Share the current project
   */
  shareProject() {
    if (!this.currentProject) return;

    const projectId = this.currentProject.properties.id;
    const shareUrl = `${window.location.origin}${window.location.pathname}?project=${projectId}`;
    const projectName = this.currentProject.properties.name;

    // Use Web Share API if available
    if (navigator.share) {
      navigator.share({
        title: projectName,
        text: `Check out this project: ${projectName}`,
        url: shareUrl
      }).catch(error => {
        console.log('Error sharing:', error);
        this.fallbackShare(shareUrl);
      });
    } else {
      this.fallbackShare(shareUrl);
    }
  }

  /**
   * Fallback share method when Web Share API is not available
   * @param {string} url - The URL to share
   */
  fallbackShare(url) {
    // Copy to clipboard
    navigator.clipboard.writeText(url)
      .then(() => {
        showToast('Link copied to clipboard!');
      })
      .catch(() => {
        // If clipboard API fails, show modal with URL
        const input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        showToast('Link copied to clipboard!');
      });
  }

  /**
   * Locate the current project on the map
   */
  locateOnMap() {
    if (!this.currentProject || !this.map) return;

    // Close the panel
    this.closePanel();

    // Fly to location
    setTimeout(() => {
      this.map.flyTo({
        center: this.currentProject.geometry.coordinates,
        zoom: 15,
        duration: 1000
      });

      // Find and animate the marker
      if (window.animateMarker) {
        // This function would be defined in markers.js
        // and would handle finding and animating the correct marker
        window.animateMarker(this.currentProject.properties.id);
      }
    }, 300);
  }

  /**
   * Set the project data reference
   * @param {object} data - The project data object
   */
  setProjectData(data) {
    this.projectData = data;
  }

  /**
   * Set the map instance reference
   * @param {object} mapInstance - The map instance
   */
  setMapInstance(mapInstance) {
    this.map = mapInstance;
  }
}

// Create a global instance of the details panel manager
let detailsPanel;

/**
 * Initialize the details panel
 * @param {object} projectData - The project data object
 * @param {object} mapInstance - The map instance
 */
function initDetailsPanel(projectData, mapInstance) {
  detailsPanel = new DetailsPanel('project-details-panel', projectData, mapInstance);

  // Make it globally accessible for other scripts
  window.detailsPanel = detailsPanel;

  // Expose the showProjectDetails function
  window.showProjectDetails = function (projectId, flyToMarker = false) {
    detailsPanel.openPanel(projectId, flyToMarker);
  };
}

// Export the module if using modules
if (typeof module !== 'undefined') {
  module.exports = {
    DetailsPanel,
    initDetailsPanel
  };
}