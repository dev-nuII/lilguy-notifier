// functions/fetchWeather.js
// (moved out of js/cloud.js)

async function fetchWeather() {
  let lat = 0, lon = 0;
  try {
    const resp = await fetch("https://ipapi.co/json/");
    const data = await resp.json();
    lat = data.latitude;
    lon = data.longitude;
  } catch (e) {
    console.log("location lookup failed:", e);
  }

  let code = null;
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
    const resp = await fetch(url);
    const data = await resp.json();
    code = data.current_weather.weathercode;
  } catch (e) {
    console.log("weather lookup failed:", e);
  }

  let weather;
  if (code === 0) weather = "clear";
  else if ([1, 2, 3].includes(code)) weather = "cloudy";
  else if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) weather = "rain";
  else if ([71, 73, 75, 77, 85, 86].includes(code)) weather = "snow";
  else if ([95, 96, 99].includes(code)) weather = "storm";
  else weather = "clear";

  let drain = 1.0;
  if (weather === "rain") drain = 1.1;
  else if (weather === "storm") drain = 1.15;
  else if (weather === "snow") drain = 1.2;

  return { weather, drain };
}
