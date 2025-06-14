// ===================== CONFIGURATION API =====================
// Clé d'API pour le service meteo-concept
const apiMeteoToken = "726b1c99c171e7c9d93155a0b1721f138a48d4c33ad10e533f84fbbd55d62140";
// ===================== FIN CONFIGURATION API =====================


// ===================== FONCTIONS PRINCIPALES =====================

/**
 * Récupère et affiche la météo selon le code postal et les options choisies.
 */
async function fetchWeatherData() {
    // Récupération des valeurs du formulaire
    const postalCode = document.getElementById("postal-code").value.trim();
    const days = document.getElementById("forecast-days").value;
    const weatherResultContainer = document.getElementById("weather-result");
    weatherResultContainer.innerHTML = "Chargement...";

    try {
        // 1. Récupération des coordonnées de la commune
        const geoApiResponse = await fetch(`https://geo.api.gouv.fr/communes?codePostal=${postalCode}&fields=nom,centre&format=json`);
        const geoData = await geoApiResponse.json();

        // Si aucune commune trouvée, message d'erreur
        if (!geoData.length) {
            weatherResultContainer.innerHTML = "<p>Aucune commune trouvée pour ce code postal.</p>";
            return;
        }

        const { nom: cityName, centre:
            { coordinates: [longitude, latitude] }
        } = geoData[0];

        // 2. Récupération des prévisions météo
        const weatherApiResponse = await fetch(`https://api.meteo-concept.com/api/forecast/daily?token=${apiMeteoToken}&latlng=${latitude},${longitude}`);
        const weatherData = await weatherApiResponse.json();

        // 3. Options utilisateur
        const options = getSelectedOptions();

        // 4. Affichage des cartes météo
        displayForecastCards(cityName, latitude, longitude, weatherData.forecast.slice(0, days), options);

        // Ajout à l'historique des recherches
        addToHistory(cityName, postalCode, new Date().toLocaleString('fr-FR'));

    } catch (error) {
        // Gestion des erreurs réseau ou API
        weatherResultContainer.innerHTML = "<p>Erreur lors de la récupération des données météo.</p>";
        console.error(error);
    }
}

// ===================== OUTILS UI =====================
/**
 * Met à jour l'étiquette du nombre de jours sélectionnés (slider)
 */
function updateDaysLabel(value) {
    document.getElementById("days-label").textContent = `${value} jour${value > 1 ? "s" : ""}`;
}

/**
 * Récupère les options cochées dans le formulaire (coordonnées, pluie, vent, direction)
 */
function getSelectedOptions() {
    return {
        coordinates: document.getElementById('show-coordinates').checked,
        rain: document.getElementById('show-rain').checked,
        wind: document.getElementById('show-wind').checked,
        windDir: document.getElementById('show-wind-dir').checked,
    };
}
// ===================== FIN OUTILS UI ===================== // 


// ===================== AFFICHAGE DES CARTES MÉTÉO ===================== //

/**
 * Affiche les cartes météo pour chaque jour, selon les options cochées.
 */
function displayForecastCards(cityName, latitude, longitude, forecasts, options) {
    const weatherResultContainer = document.getElementById("weather-result");
    let html = `<h1>Météo de ${cityName} pour ${forecasts.length} jour${forecasts.length > 1 ? "s" : ""}</h1>`;
    html += `<div class="weather-cards-container">`;

    forecasts.forEach((day, index) => {
        // Date de prévision formatée
        const today = new Date();
        const forecastDate = new Date(today);
        forecastDate.setDate(today.getDate() + index);
        const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
        const formattedDate = dateFormatter.format(forecastDate);
        const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

        // Sélection de l'icône météo
        let iconGif = "sun.gif";
        if (day.wind10m > 40) {
            iconGif = "wind.gif";
        } else if (day.rr10 > 5) {
            iconGif = "rain.gif";
        } else if ((day.probarain > 30) || (day.cloudcover > 60)) {
            iconGif = "rain-cloud.gif";
        } else if (day.sunshine > 5 * 60) {
            iconGif = "sun.gif";
        }

        // Construction de la carte météo du jour
        html += `<div class="weather-card">`;
        html += `<h3>${capitalizedDate}</h3>`;
        html += `<div class="weather-icon"><img src="img/weather/${iconGif}" alt="Icône météo" width="64" height="64"></div>`;
        html += `<p><strong>Temp. Min :</strong> ${day.tmin}°C</p>`;
        html += `<p><strong>Temp. Max :</strong> ${day.tmax}°C</p>`;
        if (options.coordinates) {
            html += `<p><strong>Coordonnée géographique :</strong> ${latitude}, ${longitude}</p>`;
        }
        if (options.rain) html += `<p><strong>Cumul pluie :</strong> ${day.rr10 ?? "N/A"} mm</p>`;
        if (options.wind) html += `<p><strong>Vent moyen :</strong> ${day.wind10m ?? "N/A"} km/h</p>`;
        if (options.windDir) html += `<p><strong>Direction vent :</strong> ${day.dirwind10m ?? "N/A"}°</p>`;
        html += `</div>`;
    });

    
    weatherResultContainer.innerHTML = html;
}
// ===================== FIN AFFICHAGE CARTES MÉTÉO ===================== //




// ===================== LOADER (écran de chargement) =====================

window.addEventListener('load', function () {
    const loader = document.getElementById('loader-frog');
    loader.classList.add('hide');
    setTimeout(() => {
        loader.style.display = 'none';
    }, 3000);
});
// ===================== FIN LOADER =====================

// ===================== HISTORIQUE RECHERCHES ===================== //

/**
 * Ajoute une recherche à l'historique et l'affiche
 */
function addToHistory(city, postalCode, date) {
    const history = JSON.parse(localStorage.getItem('weatherHistory') || '[]');
    history.unshift({ city, postalCode, date });
    localStorage.setItem('weatherHistory', JSON.stringify(history.slice(0, 5))); // max 5 entrées
    displayHistory();
}

/**
 * Affiche l'historique des recherches
 */
function displayHistory() {
    const history = JSON.parse(localStorage.getItem('weatherHistory') || '[]');
    const list = document.getElementById('history-list');
    if (!list) return;
    list.innerHTML = history.length === 0
        ? "<li>Aucune recherche récente.</li>"
        : history.map(item =>
            `<li>
                <strong>${item.city}</strong> (${item.postalCode})<br>
                <small>${item.date}</small>
            </li>`
        ).join('');
}

// Affiche l'historique au chargement de la page
window.addEventListener('DOMContentLoaded', displayHistory);
// ===================== FIN HISTORIQUE RECHERCHES ===================== //

// Gestion de l'ouverture/fermeture de l'onglet historique
document.getElementById('open-history').addEventListener('click', function () {
    document.getElementById('history-panel').classList.add('open');
    document.getElementById('history-panel').focus();
});
document.getElementById('close-history').addEventListener('click', function () {
    document.getElementById('history-panel').classList.remove('open');
});

// (Optionnel) Fermer l'onglet avec la touche Échap
document.addEventListener('keydown', function (e) {
    if (e.key === "Escape") {
        document.getElementById('history-panel').classList.remove('open');
    }
});

