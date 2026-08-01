const API_Key = "cd43234dd021184eb80cc460a1c97f65";
const url = "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";

const searchInput = document.getElementById("search");
const searchBtn = document.getElementById("search-btn");
const warning = document.querySelector(".warning");
const weatherNow = document.querySelector(".weather-Now");
const weatherIcon = document.querySelector(".weather-icon");

if (searchInput) {
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      getCity();
    }
  });
}

if (searchBtn) {
  searchBtn.addEventListener("click", () => getCity());
}

function getCity() {
  const city = searchInput.value;
  if (city == "") {
    warning.innerHTML = "Please enter a city name";
    weatherNow.classList.add("hidden");
  } else {
    getWeather(city);
    weatherNow.classList.remove("hidden");
    weatherNow.classList.add("show");
    warning.innerHTML = "";
  }
}

async function getWeather(city) {
  try {
    const response = await fetch(url + `${city}&appid=${API_Key}`);
    const data = await response.json();
    if (data.cod === 404 || !data.main) {
      warning.innerHTML = `<h1>City Not Found</h1>`;
      weatherNow.classList.remove("show");
      weatherNow.classList.add("hidden");
      return;
    }
    console.log(data);
    const temp = Math.round(data.main.temp);
    const city_name = data.name;
    const wind = data.wind.speed;
    const humidity = data.main.humidity;
    const climateName = data.weather[0].main;
    const climateDescription = data.weather[0].description;
    console.log(
      "Climate name:",
      climateName + "\nClimate description:",
      climateDescription,
    );

    document.getElementById("description").innerHTML = climateDescription;
    document.getElementById("temp").innerHTML = temp + "°C";
    document.getElementById("city").innerHTML = city_name;
    document.getElementById("wind").innerHTML = wind + " km/hr";
    document.getElementById("humidity").innerHTML = humidity + "%";

    if (climateName === "Clear") {
      weatherIcon.src = "images/sun.png";
      weatherIcon.alt = "Clear sky";
    } else if (climateName === "Clouds") {
      weatherIcon.src = "images/cloudy.png";
      weatherIcon.alt = "Cloudy";
    } else if (climateName === "Rain" || climateName === "Drizzle") {
      weatherIcon.src = "images/rainy-day.png";
      weatherIcon.alt = "Rainy";
    } else if (climateName === "Snow") {
      weatherIcon.src = "images/snow.png";
      weatherIcon.alt = "Snowing";
    } else if (climateName === "Thunderstorm") {
      weatherIcon.src = "images/thunder.png";
      weatherIcon.alt = "Thunderstorm";
    } else if (climateName === "Mist") {
      weatherIcon.src = "images/mist.png";
      weatherIcon.alt = "Misty";
    } else if (climateName === "Fog") {
      weatherIcon.src = "images/fog.png";
      weatherIcon.alt = "Foggy";
    }
  } catch (error) {
    console.log(error);
    warning.innerHTML = `<h3>A problem occured, please try again later</h3>`;
    weatherNow.classList.remove("show");
    weatherNow.classList.add("hidden");
  }
}
