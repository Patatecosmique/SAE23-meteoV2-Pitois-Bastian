// Clé d'API pour accéder au service météo
const apiMeteoToken = "726b1c99c171e7c9d93155a0b1721f138a48d4c33ad10e533f84fbbd55d62140";

/**
 * Fonction principale pour récupérer et afficher la météo
 */
async function fetchWeatherData() {
    const postalCode = document.getElementById("postal-code").value.trim();
    const days = document.getElementById("forecast-days").value;
    const weatherResultContainer = document.getElementById("weather-result");
    weatherResultContainer.innerHTML = "Chargement...";

    try {
        const geoApiResponse = await fetch(`https://geo.api.gouv.fr/communes?codePostal=${postalCode}&fields=nom,centre&format=json`);
        const geoData = await geoApiResponse.json();

        if (!geoData.length) {
            weatherResultContainer.innerHTML = "<p>Aucune commune trouvée pour ce code postal.</p>";
            return;
        }

        const { nom: cityName, centre: { coordinates: [longitude, latitude] } } = geoData[0];

        const weatherApiResponse = await fetch(`https://api.meteo-concept.com/api/forecast/daily?token=${apiMeteoToken}&latlng=${latitude},${longitude}`);
        const weatherData = await weatherApiResponse.json();

        // Récupérer les options sélectionnées
        const options = getSelectedOptions();

        // Générer l'affichage météo selon les options
        displayForecastCards(cityName, latitude, longitude, weatherData.forecast.slice(0, days), options);

    } catch (error) {
        weatherResultContainer.innerHTML = "<p>Erreur lors de la récupération des données météo.</p>";
        console.error(error);
    }
}

// Nouvelle fonction pour afficher les cartes météo selon les options cochées
function displayForecastCards(cityName, latitude, longitude, forecasts, options) {
    const weatherResultContainer = document.getElementById("weather-result");
    let html = `<h1>Météo de ${cityName} pour ${forecasts.length} jour${forecasts.length > 1 ? "s" : ""}</h1>`;
    html += `<div class="weather-cards-container">`;

    forecasts.forEach((day, index) => {
        // Calcul de la date
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

        // Choix du GIF météo selon les conditions
        let iconGif = "sun.gif"; // Par défaut
        if (day.wind10m !== undefined && day.wind10m !== null && day.wind10m > 40) {
            iconGif = "wind.gif"; // Beaucoup de vent
        } else if (day.rr10 !== undefined && day.rr10 !== null && day.rr10 > 5) {
            iconGif = "rain.gif"; // Pluie forte
        } else if (
            (day.probarain !== undefined && day.probarain !== null && day.probarain > 30) ||
            (day.cloudcover !== undefined && day.cloudcover !== null && day.cloudcover > 60)
        ) {
            iconGif = "rain-cloud.gif"; // Nuageux ou risque d'averses
        } else if (day.sunshine !== undefined && day.sunshine !== null && day.sunshine > 5 * 60) {
            iconGif = "sun.gif"; // Ensoleillé
        }

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

    html += `</div>`;
    weatherResultContainer.innerHTML = html;
}

/**
 * Met à jour l'étiquette du nombre de jours sélectionnés
 * @param {number} value - Le nombre de jours sélectionnés
 */
function updateDaysLabel(value) {
    document.getElementById("days-label").textContent = `${value} jour${value > 1 ? "s" : ""}`;
}

function getSelectedOptions() {
    return {
        coordinates: document.getElementById('show-coordinates').checked,
        rain: document.getElementById('show-rain').checked,
        wind: document.getElementById('show-wind').checked,
        windDir: document.getElementById('show-wind-dir').checked,
    };
}

function displayWeather(data) {
    const options = getSelectedOptions();
    const resultSection = document.getElementById('weather-result');
    resultSection.innerHTML = ""; // Nettoie l'affichage précédent

    data.forEach(day => {
        let html = `<div class="weather-card">`;
        html += `<h3>${day.date}</h3>`;
        html += `<p>Température : ${day.temp}°C</p>`;
        if (options.latitude && day.latitude) html += `<p>Latitude : ${day.latitude}</p>`;
        if (options.longitude && day.longitude) html += `<p>Longitude : ${day.longitude}</p>`;
        if (options.rain && day.rain) html += `<p>Cumul pluie : ${day.rain} mm</p>`;
        if (options.wind && day.wind) html += `<p>Vent moyen : ${day.wind} km/h</p>`;
        if (options.windDir && day.windDir) html += `<p>Direction vent : ${day.windDir}°</p>`;
        html += `</div>`;
        resultSection.innerHTML += html;
    });
}


