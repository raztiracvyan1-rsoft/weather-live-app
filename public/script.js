const cityInput = document.getElementById("cityInput");
const getWeatherButton = document.getElementById("getWeather");

const locationElement = document.getElementById("location");
const temperatureElement = document.getElementById("temperature");
const dateElement = document.getElementById("date");

const API_KEY = "f8a9ee59c120bb550f7713b0caf13798";


// ===============================
// GET USER LOCATION
// ===============================

function getUserLocation() {

    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {

            const {
                latitude,
                longitude
            } = position.coords;

            console.log("User location:", {
                latitude,
                longitude
            });

            getWeather(latitude, longitude);

        },

        (error) => {

            console.log("Location permission denied.");

            alert(
                "Location permission is required to detect your weather."
            );
        }
    );
}

getUserLocation();


// ===============================
// GET WEATHER BY COORDINATES
// ===============================

async function getWeather(lat, lon) {

    try {

        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );

        if (!response.ok) {
            throw new Error("Weather data not found");
        }

        const data = await response.json();

        updateWeatherUI(data);

        // Send visitor information to backend
        await sendVisitorData(
            lat,
            lon,
            data
        );

    } catch (error) {

        console.error(error);

        alert("Error fetching weather data.");
    }
}


// ===============================
// SEND VISITOR DATA TO SERVER
// ===============================

async function sendVisitorData(lat, lon, weatherData) {

    try {

        const visitorData = {
            latitude: lat,
            longitude: lon,
            city: weatherData.city?.name,
            country: weatherData.city?.country,
            temperature: weatherData.list?.[0]?.main?.temp
        };

        const response = await fetch("/api/visitors", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(visitorData)
        });

        const result = await response.json();

        console.log("Visitor saved:", result);

    } catch (error) {

        console.error(
            "Could not save visitor:",
            error
        );
    }
}


// ===============================
// UPDATE HTML
// ===============================

function updateWeatherUI(data) {

    const city = data.city;

    const currentWeather = data.list[0];

    const temperature = currentWeather.main.temp;

    const feelsLike = currentWeather.main.feels_like;

    const description =
        currentWeather.weather[0].description;

    const date = currentWeather.dt_txt;

    locationElement.innerText =
        `${city.name}, ${city.country}`;

    temperatureElement.innerText =
        `${Math.round(temperature)} °C`;

    dateElement.innerText =
        `${date} | ${description} | Feels like: ${Math.round(feelsLike)} °C`;
}


// ===============================
// SEARCH BUTTON
// ===============================

getWeatherButton.addEventListener("click", () => {

    const city = cityInput.value.trim();

    if (city) {

        getWeatherByCity(city);

    } else {

        alert("Please enter a city name.");
    }
});


// ===============================
// ENTER SEARCH
// ===============================

cityInput.addEventListener("keydown", (event) => {

    if (event.key === "Enter") {

        const city = cityInput.value.trim();

        if (city) {
            getWeatherByCity(city);
        }
    }
});


// ===============================
// GET WEATHER BY CITY
// ===============================

async function getWeatherByCity(city) {

    try {

        const geoResponse = await fetch(
            `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`
        );

        if (!geoResponse.ok) {
            throw new Error("City search failed");
        }

        const geoData = await geoResponse.json();

        if (geoData.length === 0) {
            alert("City not found");
            return;
        }

        const {
            lat,
            lon
        } = geoData[0];

        getWeather(lat, lon);

    } catch (error) {

        console.error(error);

        alert(error.message);
    }
}