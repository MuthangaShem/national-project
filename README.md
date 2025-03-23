# National Project Portfolio Showcase Map

An interactive web-based mapping application for showcasing construction and development projects across the United States. This portfolio project demonstrates GIS development skills with customizable filters, interactive markers, and detailed project information.

![Project Screenshot](Enregistrement-de-l’écran-2025-03-23-à-15.46.52.gif)

## Features

- **Interactive Map**: Explore project locations with pan and zoom controls
- **Project Filtering**: Filter by project type, status, year, and text search
- **Custom Markers**: Color-coded markers based on project type with status indicators
- **Project Details**: Rich information panels with project specifications and imagery
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Sharing Capability**: Direct links to specific projects for easy sharing

## Technology Stack

- **Mapping**: [Mapbox GL JS](https://www.mapbox.com/mapbox-gl-js)
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Geospatial Analysis**: [Turf.js](https://turfjs.org/)
- **Data Format**: GeoJSON

## Installation and Setup

### Prerequisites

- A Mapbox account with an access token ([Get one here](https://account.mapbox.com/))
- A web server (local or remote) to serve the files

### Setup Instructions

1. Clone or download this repository
2. Copy `config.template.js` to `config.js`
3. Add your Mapbox access token to `config.js`:
   ```javascript
   const config = {
     mapboxAccessToken: 'YOUR_MAPBOX_ACCESS_TOKEN',
     // other settings...
   };
   ```
4. Serve the project using a web server

#### Local Development Server Options

- Python: `python -m http.server 8000`
- Node.js: `npx serve`
- VS Code: Use the [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)

## Project Structure

```
project-portfolio-map/
├── index.html              # Main HTML file
├── config.template.js      # Configuration template
├── config.js               # Configuration with your API keys (gitignored)
├── assets/
│   ├── css/                # CSS stylesheets
│   │   ├── main.css        # Main styling
│   │   ├── map.css         # Map-specific styling
│   │   ├── sidebar.css     # Sidebar styling
│   │   └── details-panel.css # Details panel styling
│   ├── js/                 # JavaScript files
│   │   ├── main.js         # Main application logic
│   │   ├── map.js          # Map initialization and control
│   │   ├── filters.js      # Filter functionality
│   │   ├── popup.js        # Popup creation and handling
│   │   ├── markers.js      # Custom marker creation
│   │   └── details-panel.js # Details panel functionality
│   ├── data/
│   │   └── projects.geojson # Project data
│   └── images/
│       ├── markers/        # Marker icons
│       ├── projects/       # Project images
│       └── ui/             # UI icons
└── .gitignore              # Git ignore configuration
```

## Customization

### Adding Your Own Projects

Edit the `assets/data/projects.geojson` file to include your own projects. Each project should follow this structure:

```json
{
  "type": "Feature",
  "geometry": {
    "type": "Point",
    "coordinates": [-122.4194, 37.7749]
  },
  "properties": {
    "id": "proj-001",
    "name": "Project Name",
    "type": "Commercial",
    "subtype": "Office",
    "status": "Completed",
    "year": 2022,
    "budget": 42500000,
    "description": "Project description goes here...",
    "client": "Client Name",
    "imageUrl": "assets/images/projects/project-image.jpg",
    "address": "123 Market Street, San Francisco, CA",
    "highlights": ["Feature 1", "Feature 2", "Feature 3"]
  }
}
```

### Changing Map Style

To use a different Mapbox map style, edit the `mapStyle` option in `map.js`:

```javascript
this.options = Object.assign({
  // other options...
  mapStyle: 'mapbox://styles/mapbox/light-v11', // Change this to your preferred style
  // other options...
}, options);
```

Available Mapbox styles include:
- `mapbox://styles/mapbox/light-v11`
- `mapbox://styles/mapbox/dark-v11`
- `mapbox://styles/mapbox/streets-v12`
- `mapbox://styles/mapbox/outdoors-v12`
- `mapbox://styles/mapbox/satellite-streets-v12`

Or create your own custom style in the [Mapbox Studio](https://studio.mapbox.com/).

## Browser Compatibility

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Android Chrome)

## License

This project is available for personal and educational use.

## Acknowledgments

- [Mapbox GL JS](https://www.mapbox.com/mapbox-gl-js) for the mapping platform
- Sample data is fictional and created for demonstration purposes only
