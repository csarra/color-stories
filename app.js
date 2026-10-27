// =========================================================================
// 1. DATA MODEL DECLARATION
// =========================================================================
const regionDataset = [
    {
        id: "egypt",
        name: "Egyptian Blue",
        description: "Approximate geographic bounding envelope containing Egypt.",
        colorHex: "#1034A6",
        center: { lat: 26.8206, lng: 30.8025 },
        zoom2D: 5,
        altitude3D: 2500000,
        path: [
            { lat: 31.3000, lng: 25.0000 }, // NW Border
            { lat: 31.6000, lng: 34.2000 }, // NE Mediterranean
            { lat: 29.5000, lng: 34.9000 }, // Sinai Tip
            { lat: 22.0000, lng: 36.9000 }, // SE Border
            { lat: 22.0000, lng: 25.0000 }  // SW Border
        ]
    },
    {
        id: "peru",
        name: "Carmine",
        description: "Initial basic boundary path encompassing Peru.",
        colorHex: "#960018",
        center: { lat: -9.1900, lng: -75.0152 },
        zoom2D: 5,
        altitude3D: 3000000,
        path: [
            { lat: -0.1000, lng: -75.2000 }, // North Apex
            { lat: -3.4000, lng: -70.0000 }, // Northeast edge
            { lat: -18.3000, lng: -70.3000 }, // South border
            { lat: -11.5000, lng: -77.3000 }, // West coast mid
            { lat: -4.5000, lng: -81.2000 }   // Northwest tip
        ]
    },
    {
        id: "madagascar",
        name: "Verdigris",
        description: "Operational tracking area surrounding the island of Madagascar.",
        colorHex: "#43B3AE",
        center: { lat: -18.7669, lng: 46.8691 },
        zoom2D: 5,
        altitude3D: 2000000,
        path: [
            { lat: -11.9500, lng: 49.2800 }, // North tip
            { lat: -15.3000, lng: 50.5000 }, // East cape
            { lat: -25.6000, lng: 45.1500 }, // South tip
            { lat: -23.3800, lng: 43.6000 }, // Southwest
            { lat: -16.1500, lng: 44.4000 }  // Northwest
        ]
    }
];

// Global State Trackers
let is3DMode = false;
let active2DOverlays = [];

// =========================================================================
// 2. CORE MAP RENDERING PIPELINE (Keep function intact)
// =========================================================================
async function initApp() {
    const toggleButton = document.getElementById("toggle-view-btn");
    const map2DElement = document.getElementById("map-2d");
    const map3DElement = document.getElementById("map-3d");

    // Extract runtime 2D element map instance
    const map2DInstance = map2DElement.innerMap;
    
    // Explicitly import your drawing tool primitives from the Google dynamic scope
    const { Polygon } = await google.maps.importLibrary("maps");
    const { Polygon3DElement } = await google.maps.importLibrary("maps3d");

    // Render geographic features to both layer architectures
    render2DRegions(map2DInstance, Polygon);
    render3DRegions(map3DElement, Polygon3DElement);

    // Populate Sidebar UI Navigation elements
    buildSidebar(map2DInstance, map3DElement);

    // Orchestrate 2D Vector vs 3D Globe presentation modes
    toggleButton.addEventListener("click", () => {
        is3DMode = !is3DMode;
        if (is3DMode) {
            map2DElement.classList.add("hidden");
            map3DElement.classList.remove("hidden");
            toggleButton.innerText = "Switch to 2D Vector View";
            toggleButton.style.backgroundColor = "#e0115f";
        } else {
            map3DElement.classList.add("hidden");
            map2DElement.classList.remove("hidden");
            toggleButton.innerText = "Switch to 3D Globe View";
            toggleButton.style.backgroundColor = "#1a73e8";
        }
    });
}

// =========================================================================
// 3. UI GENERATION & SUBSYSTEM HELPERS
// =========================================================================
function buildSidebar(map2DInstance, map3DElement) {
    const listContainer = document.getElementById("regions-list");
    
    // Clear out container to prevent duplicate lists on hot-reloads
    listContainer.innerHTML = "";

    regionDataset.forEach(region => {
        const card = document.createElement("div");
        card.className = "region-card";
        card.innerHTML = `
            <div>
                <span class="color-badge" style="background-color: ${region.colorHex}"></span>
                <span class="region-name">${region.name}</span>
            </div>
            <div class="region-desc">${region.description}</div>
        `;

        card.addEventListener("click", () => {
            if (is3DMode) {
                // Animate 3D Camera system
                map3DElement.flyTo({
                    center: { lat: region.center.lat, lng: region.center.lng, altitude: region.altitude3D },
                    tilt: 20,
                    durationMillis: 2500
                });
            } else {
                // Pan flat 2D viewport
                map2DInstance.setCenter(region.center);
                map2DInstance.setZoom(region.zoom2D);
            }
        });
        listContainer.appendChild(card);
    });
}

function render2DRegions(mapInstance, PolygonClass) {
    regionDataset.forEach(region => {
        const poly2D = new PolygonClass({
            paths: region.path,
            strokeColor: region.colorHex,
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: region.colorHex,
            fillOpacity: 0.35,
            map: mapInstance
        });
        active2DOverlays.push(poly2D);
    });
}

function render3DRegions(globeElement, Polygon3DClass) {
    regionDataset.forEach(region => {
        const poly3D = new Polygon3DClass({
            paths: region.path,
            strokeColor: region.colorHex,
            strokeWidth: 3,
            fillColor: convertHexToRgba(region.colorHex, 0.4),
            extruded: true // Extrude bounds into a geometric 3D volume block
        });
        globeElement.appendChild(poly3D);
    });
}

function convertHexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// =========================================================================
// 4. THE LIFECYCLE WRAPPER
// =========================================================================
// Safely defer map assignment until Vercel completes structural DOM compilation
window.addEventListener('DOMContentLoaded', initApp);
