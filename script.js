const API_KEY = "cabe91aed1a7e81256dcaf29613859f4";
const API_URL = "https://api.openweathermap.org/data/2.5";

const searchForm = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");
const locationButton = document.getElementById("location-button");

const errorMessage = document.getElementById("error-message");
const recentCities = document.getElementById("recent-cities");

const currentCity = document.getElementById("current-city");
const currentDate = document.getElementById("current-date");
const weatherIcon = document.getElementById("weather-icon");
const temperature = document.getElementById("temperature");
const weatherDescription = document.getElementById("weather-description");

const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("wind-speed");
const feelsLike = document.getElementById("feels-like");

const forecastContainer = document.getElementById("forecast");

// Search City
searchForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const city = cityInput.value.trim();

    if (!city) {
        showError("Please enter a city name.");
        return;
    }

    getWeatherByCity(city);
});

// Get Weather By City
async function getWeatherByCity(city) {
    hideError();

    try {
        const currentResponse = await fetch(
            `${API_URL}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
        );

        if (!currentResponse.ok) {
            throw new Error("City not found");
        }

        const currentData = await currentResponse.json();

        const forecastResponse = await fetch(
            `${API_URL}/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
        );

        if (!forecastResponse.ok) {
            throw new Error("Forecast could not be loaded");
        }

        const forecastData = await forecastResponse.json();

        displayCurrentWeather(currentData);
        displayForecast(forecastData);

        saveRecentCity(currentData.name);
        displayRecentCities();

        cityInput.value = "";

    } catch (error) {
        console.error(error);
        showError("City not found. Please check the city name and try again.");
    }
}

// Display Current Weather
function displayCurrentWeather(data) {
    currentCity.textContent = `${data.name}, ${data.sys.country}`;

    const date = new Date();

    currentDate.textContent = date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });

    temperature.textContent = Math.round(data.main.temp);

    weatherDescription.textContent =
        capitalizeFirstLetter(data.weather[0].description);

    humidity.textContent = `${data.main.humidity}%`;

    windSpeed.textContent = `${data.wind.speed} m/s`;

    feelsLike.textContent =
        `${Math.round(data.main.feels_like)}°C`;

    const iconCode = data.weather[0].icon;

    weatherIcon.src =
        `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

    weatherIcon.alt = data.weather[0].description;
}

// Display 5-Day Forecast
function displayForecast(data) {
    forecastContainer.innerHTML = "";

    const dailyForecasts = {};

    data.list.forEach(item => {
        const date = item.dt_txt.split(" ")[0];

        if (!dailyForecasts[date]) {
            dailyForecasts[date] = item;
        }

        const hour = item.dt_txt.split(" ")[1];

        if (hour === "12:00:00") {
            dailyForecasts[date] = item;
        }
    });

    const forecastDays =
        Object.values(dailyForecasts).slice(1, 6);

    forecastDays.forEach(day => {
        const date = new Date(day.dt * 1000);

        const dayName = date.toLocaleDateString("en-US", {
            weekday: "short"
        });

        const iconCode = day.weather[0].icon;

        const description =
            capitalizeFirstLetter(day.weather[0].description);

        const card = document.createElement("div");

        card.classList.add("forecast-card");

        card.innerHTML = `
            <h3>${dayName}</h3>

            <img
                src="https://openweathermap.org/img/wn/${iconCode}@2x.png"
                alt="${description}"
            >

            <p class="forecast-description">
                ${description}
            </p>

            <strong>
                ${Math.round(day.main.temp)}°C
            </strong>

            <p>
                💧 ${day.main.humidity}%
            </p>

            <p>
                💨 ${day.wind.speed} m/s
            </p>
        `;

        forecastContainer.appendChild(card);
    });
}

// Save Recent City
function saveRecentCity(city) {
    let cities =
        JSON.parse(localStorage.getItem("recentCities")) || [];

    cities = cities.filter(
        item => item.toLowerCase() !== city.toLowerCase()
    );

    cities.unshift(city);

    cities = cities.slice(0, 3);

    localStorage.setItem(
        "recentCities",
        JSON.stringify(cities)
    );
}

// Display Recent Cities
function displayRecentCities() {
    const cities =
        JSON.parse(localStorage.getItem("recentCities")) || [];

    recentCities.innerHTML = "";

    cities.forEach(city => {
        const button = document.createElement("button");

        button.textContent = city;
        button.type = "button";

        button.addEventListener("click", function () {
            getWeatherByCity(city);
        });

        recentCities.appendChild(button);
    });
}

// Geolocation
locationButton.addEventListener("click", function () {
    hideError();

    if (!navigator.geolocation) {
        showError(
            "Geolocation is not supported by your browser."
        );
        return;
    }

    navigator.geolocation.getCurrentPosition(
        function (position) {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            getWeatherByLocation(latitude, longitude);
        },

        function () {
            showError(
                "Unable to get your location. Please allow location access."
            );
        }
    );
});

// Weather By Location
async function getWeatherByLocation(latitude, longitude) {
    try {
        const currentResponse = await fetch(
            `${API_URL}/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
        );

        if (!currentResponse.ok) {
            throw new Error("Location weather failed");
        }

        const currentData = await currentResponse.json();

        const forecastResponse = await fetch(
            `${API_URL}/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
        );

        if (!forecastResponse.ok) {
            throw new Error("Forecast failed");
        }

        const forecastData = await forecastResponse.json();

        displayCurrentWeather(currentData);
        displayForecast(forecastData);

        saveRecentCity(currentData.name);
        displayRecentCities();

    } catch (error) {
        console.error(error);

        showError(
            "Unable to load weather for your location."
        );
    }
}

// Error Messages
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = "block";
}

function hideError() {
    errorMessage.textContent = "";
    errorMessage.style.display = "none";
}

// Helper
function capitalizeFirstLetter(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

// Load Recent Cities
displayRecentCities();

