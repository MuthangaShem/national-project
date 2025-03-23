// popup.js - Handles the creation and management of map popups

/**
 * Creates HTML content for a custom popup based on project properties
 * @param {Object} properties - Properties object from the GeoJSON feature
 * @returns {string} HTML content for the popup
 */
function createCustomPopupHTML(properties) {
    // Format budget as currency (with fallback if budget is missing)
    const formattedBudget = properties.budget ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    }).format(properties.budget) : 'N/A';

    // Create highlights list if available
    let highlightsHTML = '';
    if (properties.highlights && Array.isArray(properties.highlights) && properties.highlights.length) {
        highlightsHTML = `
      <div class="popup-highlights">
        <h4>Highlights</h4>
        <ul>
          ${properties.highlights.map(item => `<li>${item}</li>`).join('')}
        </ul>
      </div>
    `;
    }

    // Create popup HTML with safety checks for all properties
    return `
    <div class="custom-popup">
      <div class="popup-header ${properties.type ? properties.type.toLowerCase() : 'default'}">
        <h3>${properties.name || 'Unnamed Project'}</h3>
      </div>

      ${properties.imageUrl ?
            `<div class="popup-image">
             <span class="popup-badge status-${properties.status ? properties.status.toLowerCase().replace(/\s+/g, '-') : 'unknown'}">${properties.status || 'Unknown'}</span>
          <img src="${properties.imageUrl}" alt="${properties.name || 'Project image'}">
        </div>` : ''}

      <div class="popup-content">
        <div class="popup-details">
          <p class="popup-description">${properties.description || 'No description available.'}</p>
          <p class="popup-location"><strong>Location:</strong> ${properties.address || 'Location not specified'}</p>
          <p class="popup-meta"><strong>Type:</strong> ${properties.type || 'N/A'} | <strong>Year:</strong> ${properties.year || 'N/A'} | <strong>Budget:</strong> ${formattedBudget}</p>
          <p class="popup-client"><strong>Client:</strong> ${properties.client || 'N/A'}</p>
        </div>

        ${highlightsHTML}

        <div class="popup-actions">
          <button class="btn btn-details" data-project-id="${properties.id || ''}">View Details</button>
          <button class="btn btn-share" data-project-id="${properties.id || ''}">Share</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Creates a custom popup for a project feature
 * @param {Object} feature - GeoJSON feature object representing a project
 * @returns {mapboxgl.Popup} - Mapbox GL popup object
 */
function createCustomPopup(feature) {
    const popupHTML = createCustomPopupHTML(feature.properties);

    return new mapboxgl.Popup({
        offset: 25,
        maxWidth: '320px',
        className: 'project-popup'
    }).setHTML(popupHTML);
}

/**
 * Handles share action from a popup
 * @param {string} projectId - ID of the project to share
 */
function shareProject(projectId) {
    // Create shareable URL with project ID
    const shareUrl = `${window.location.origin}${window.location.pathname}?project=${projectId}`;

    // If Web Share API is available
    if (navigator.share) {
        navigator.share({
            title: 'Check out this project',
            url: shareUrl
        }).catch(error => {
            console.log('Error sharing:', error);
            copyToClipboard(shareUrl);
        });
    } else {
        // Fallback: copy to clipboard
        copyToClipboard(shareUrl);
    }
}

/**
 * Helper function to copy text to clipboard
 * @param {string} text - Text to copy to clipboard
 */
function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => {
            // Show success message using the global showToast function
            if (window.showToast) {
                window.showToast('Link copied to clipboard!');
            }
        })
        .catch(() => {
            // Fallback method
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';  // Avoid scrolling to bottom
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            try {
                document.execCommand('copy');
                if (window.showToast) {
                    window.showToast('Link copied to clipboard!');
                }
            } catch (err) {
                console.error('Failed to copy: ', err);
                if (window.showToast) {
                    window.showToast('Failed to copy link');
                }
            }

            document.body.removeChild(textArea);
        });
}

// Add event listener for popup buttons - Using event delegation
document.addEventListener('click', function (e) {
    // Handle share button
    if (e.target.classList.contains('btn-share')) {
        const projectId = e.target.getAttribute('data-project-id');
        if (projectId) {
            shareProject(projectId);
        }
    }
});

// Export functions for use in other files
if (typeof module !== 'undefined') {
    module.exports = {
        createCustomPopupHTML,
        createCustomPopup,
        shareProject
    };
}