let map;
let markers = [];
let placesListElement;
let detailsContainer;
let searchBar;
let apiKey;

async function loadGoogleMaps() {
    try {
        const response = await fetch("http://localhost:3000/api/google-maps-key"); // Appel au backend pour obtenir la clé API
        const data = await response.json();
        apiKey = data.apiKey;
        (g => { var h, a, k, p = "The Google Maps JavaScript API", c = "google", l = "importLibrary", q = "__ib__", m = document, b = window; b = b[c] || (b[c] = {}); var d = b.maps || (b.maps = {}), r = new Set, e = new URLSearchParams, u = () => h || (h = new Promise(async (f, n) => { await (a = m.createElement("script")); e.set("libraries", [...r] + ""); for (k in g) e.set(k.replace(/[A-Z]/g, t => "_" + t[0].toLowerCase()), g[k]); e.set("callback", c + ".maps." + q); a.src = `https://maps.${c}apis.com/maps/api/js?` + e; d[q] = f; a.onerror = () => h = n(Error(p + " could not load.")); a.nonce = m.querySelector("script[nonce]")?.nonce || ""; m.head.append(a) })); d[l] ? console.warn(p + " only loads once. Ignoring:", g) : d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n)) })({
            key: apiKey
        });
        initMap();
    } catch (error) {
        console.error("Erreur lors du chargement :", error);
    }
};



async function initMap() {
    const { Map } = await google.maps.importLibrary("maps");
    const { Marker } = await google.maps.importLibrary("marker");
    const { Autocomplete } = await google.maps.importLibrary("places");

    map = new Map(document.getElementById("map"), {
        center: { lat: 46.603354, lng: 1.888334 },
        zoom: 6,
        mapId: "f49b53da0964c209",
        zoomControl: false,
        mapTypeControl: false,
        scaleControl: false,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: false,
    });

    placesListElement = document.getElementById("places-list");
    detailsContainer = document.getElementById("place-details");
    searchBar = document.getElementById("search-container");
    const searchInput = document.getElementById("place-search");
    const autocomplete = new Autocomplete(searchInput);

    autocomplete.bindTo("bounds", map);


    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            data.forEach(place => addMarker(place));
            updatePlacesList(markers.map(({ place }) => ({ place })));
        })
        .catch(error => console.error('Erreur lors du chargement des données JSON:', error));


    autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();

        map.panTo(place.geometry.location);
        map.setZoom(10);


        const sortedMarkers = sortMarkersByDistance(place.geometry.location);
        updatePlacesList(sortedMarkers);
    });
}


function addMarker(place) {
    const defaultIcon = {
        path: "M12 2C8.1 2 5 5.1 5 9c0 4.3 4.5 10.2 6.3 12.8.4.6 1.2.6 1.6 0C14.5 19.2 19 13.3 19 9c0-3.9-3.1-7-7-7zm0 9.5c-1.4 0-2.5-1.1-2.5-2.5S10.6 6.5 12 6.5s2.5 1.1 2.5 2.5S13.4 11.5 12 11.5z",
        fillColor: "#004899",
        fillOpacity: 1,
        strokeWeight: 0,
        scale: 1.5,
        anchor: new google.maps.Point(12, 24)
    };

    const selectedIcon = {
        ...defaultIcon,
        scale: 2,
    };

    const marker = new google.maps.Marker({
        map,
        position: { lat: place.latitude, lng: place.longitude },
        title: place.Distributeur,
        icon: defaultIcon,
    });

    markers.push({ marker, place });


    marker.addListener("click", () => {

        markers.forEach(({ marker }) => marker.setIcon(defaultIcon));


        marker.setIcon(selectedIcon);

        highlightPlaceInSidebar(place);
    });
}


function updatePlacesList(placesWithDistances) {
    placesListElement.innerHTML = "";
    placesWithDistances.forEach(({ place, distance }) => {
        const listItem = createListItem(place, distance);
        placesListElement.appendChild(listItem);
    });
}


function createListItem(place, distance) {
    const listItem = document.createElement("li");
    listItem.innerHTML = `
    <h3>${place.Distributeur}</h3>
    <p>${place.Adresse}</p>
    ${distance !== undefined ? `<p>Distance : ${distance.toFixed(1)} km</p>` : ""}
  `;
    listItem.classList.add("place-item");
    listItem.onclick = () => {
        map.panTo({ lat: place.latitude, lng: place.longitude });
        map.setZoom(9);
        highlightPlaceInSidebar(place);
        showPlaceDetails(place);
    };
    return listItem;
}

function showPlaceDetails(place) {
    detailsContainer.innerHTML = `
    <div class="header-container">
<img id="logo" src="logo.jpg"/>
<button id="back-button" aria-label="Retour">
  <svg width="24" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 19L8 12L15 5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
</button>
</div>
<div class="place-detail">
    <div class="cadre">
        <h3>Agence ${place.Distributeur} ${place.lieu}</h3>
        <p> ${place.Adresse}</p>
    </div>
    <p><strong>Zone:</strong> ${place.Zone}</p>
    <p><strong>Gestionnaire:</strong> ${place.Gestionnaire}</p>
    <p><strong>Responsable:</strong> ${place.Responsable}</p>
    <p><strong>Email:</strong> ${place.mail}</p>
    <p><strong>Téléphone:</strong> ${place["Téléphone"]}</p>
    <p><strong>Journée découverte:</strong> ${place["Journée découverte"]}</p>
    <p><strong>Lieu:</strong> ${place.lieu}</p>
    
    </div>
  `;
    detailsContainer.style.display = "block";
    placesListElement.style.display = "none";
    searchBar.style.display = "none";

    document.getElementById("back-button").onclick = () => {
        detailsContainer.style.display = "none";
        placesListElement.style.display = "block";
        searchBar.style.display = "block";


        map.setCenter({ lat: 46.603354, lng: 1.888334 });
        map.setZoom(6);
    };
}


function highlightPlaceInSidebar(place) {

    document.querySelectorAll(".place-item").forEach((item) => {
        item.classList.remove("highlight");
    });


    const items = Array.from(document.querySelectorAll(".place-item"));
    const selectedItem = items.find((item) => item.innerHTML.includes(place.Distributeur));
    if (selectedItem) {
        selectedItem.classList.add("highlight");


        selectedItem.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }
}

function sortMarkersByDistance(location) {
    const distances = markers.map(({ place }) => ({
        place,
        distance: calculateDistance(
            location.lat(),
            location.lng(),
            place.latitude,
            place.longitude
        ),
    }));


    distances.sort((a, b) => a.distance - b.distance);
    return distances;
}


function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}


loadGoogleMaps();