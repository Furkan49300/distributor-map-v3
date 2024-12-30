let map;
let markers = [];
let placesListElement;
let detailsContainer;
let searchBar;
let apiKey;
let resultatpour = document.createElement("h4");
function loadGoogleMaps() {
    (g => { var h, a, k, p = "The Google Maps JavaScript API", c = "google", l = "importLibrary", q = "__ib__", m = document, b = window; b = b[c] || (b[c] = {}); var d = b.maps || (b.maps = {}), r = new Set, e = new URLSearchParams, u = () => h || (h = new Promise(async (f, n) => { await (a = m.createElement("script")); e.set("libraries", [...r] + ""); for (k in g) e.set(k.replace(/[A-Z]/g, t => "_" + t[0].toLowerCase()), g[k]); e.set("callback", c + ".maps." + q); a.src = `https://maps.${c}apis.com/maps/api/js?` + e; d[q] = f; a.onerror = () => h = n(Error(p + " could not load.")); a.nonce = m.querySelector("script[nonce]")?.nonce || ""; m.head.append(a) })); d[l] ? console.warn(p + " only loads once. Ignoring:", g) : d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n)) })({
        key: "AIzaSyBcCHz0HxzjTRiB6PnOnIOFtKL7fteGWLE"
    });
    initMap();
};



async function initMap() {
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement, PinElement, Marker } = await google.maps.importLibrary("marker");
    const { Autocomplete } = await google.maps.importLibrary("places");

    map = new Map(document.getElementById("map"), {
        center: { lat: 46.603354, lng: 2.394897792076994 },
        zoom: 6,
        mapId: "f49b53da0964c209",
        zoomControl: false,
        mapTypeControl: false,
        scaleControl: false,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: false,
    });

    placesListElement = document.querySelector("#places-list");
    detailsContainer = document.querySelector("#place-details");
    searchBar = document.querySelector("#search-container");
    const searchInput = document.querySelector("#place-search");
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
        let address = place["formatted_address"];
        console.log(address);
        map.panTo(place.geometry.location);
        map.setZoom(10);

        let resultat = address.replace(/\d+/g, '');
        resultatpour.innerHTML = "Résultats pour " + resultat;
        searchBar.insertAdjacentElement('afterend', resultatpour);

        const sortedMarkers = sortMarkersByDistance(place.geometry.location);
        updatePlacesList(sortedMarkers);
    });
}


function addMarker(place) {
    const defaultIcon = {
        url: "marker.png",
        scaledSize: new google.maps.Size(25, 34),
        anchor: new google.maps.Point(12.5, 34)
    };

    const selectedIcon = {
        ...defaultIcon,
        scaledSize: new google.maps.Size(35, 47),
        anchor: new google.maps.Point(17.5, 47)
    };

    const marker = new google.maps.Marker({
        map,
        position: { lat: place.latitude, lng: place.longitude },
        title: place.Distributeur,
        animation: google.maps.Animation.DROP,
        icon: defaultIcon,
    });

    markers.push({ marker, place });


    marker.addListener("click", () => {
        if (searchBar.style.display == "none") {
            console.log(place);
            showPlaceDetails(place);
        }
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
    <p class="agence-title">${place.Distributeur} </p>
    <p class="agence-subtitle">${place.Adresse}, ${place.zipcode} ${place.lieu}</p>
    ${distance !== undefined ? `<p><strong> ${distance.toFixed(1)} km</strong></p>` : ""}
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
    
<img id="logo" src="${place.logo}" />



    <div class="cadre">
    
        <p class="agence-title-detail">${place.Distributeur} ${place.lieu}</p>
        <p class="agence-subtitle"> ${place.Adresse}</p>
    
    <div class="details-section">
    <h2> Détails</h2>
    <ul>
    <li>Produits : <span>${place.Produit}</span></li>
    <li>Zone : <span>${place.Zone}</span></li>
    <li>Gestionnaire : <span>${place.Gestionnaire}</span></li>
    <li>Responsable : <span>${place.Responsable}</span></li>
    <li>Email : ${place.mail}</li>
    <li>Téléphone : ${place['Téléphone']}</li>
    <li>Journée découverte : <span>${place['Journée découverte']}</span></li>
</ul>
<div id="back-button" aria-label="Retour"> 
  Revenir à la page précédente
</div>
</div>

    </div>
    
    
  `;
    detailsContainer.style.display = "flex";
    placesListElement.style.display = "none";
    searchBar.style.display = "none";
    resultatpour.style.display = 'none';


    document.querySelector("#back-button").onclick = () => {
        detailsContainer.style.display = "none";
        placesListElement.style.display = "block";
        searchBar.style.display = "flex";
        resultatpour.style.display = 'block';


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