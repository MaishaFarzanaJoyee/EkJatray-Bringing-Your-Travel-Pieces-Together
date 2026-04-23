import { useEffect, useState } from "react";
import { fetchWeatherData } from "../services/joyeeService";
import { bangladeshDistricts } from "../utils/bangladeshDistricts";

function buildMapUrl(lat, lon) {
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.06}%2C${lat - 0.04}%2C${lon + 0.06}%2C${lat + 0.04}&layer=mapnik&marker=${lat}%2C${lon}`;
}

export default function WeatherPlannerPage() {
  const [location, setLocation] = useState("");
  const [weather, setWeather] = useState(null);
  const [packingList, setPackingList] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!weather) {
      return;
    }

    const temp = weather.main.temp;
    const condition = weather.weather[0].main.toLowerCase();
    const items = ["Passport / ID", "Phone Charger", "Basic Toiletries"];

    if (temp > 28) {
      items.push("Sunscreen (High UV Warning)");
      items.push("Sunglasses & Hat");
      items.push("Light Cotton Clothes");
      items.push("Reusable Water Bottle");
    } else if (temp < 15) {
      items.push("Heavy Jacket");
      items.push("Warm Gloves & Beanie");
    } else {
      items.push("Light Sweater for evenings");
    }

    if (condition.includes("rain") || condition.includes("drizzle")) {
      items.push("Umbrella");
      items.push("Waterproof Raincoat");
      items.push("Water-resistant Shoes");
    }

    setPackingList(items);
  }, [weather]);

  const handleSearch = async () => {
    setError("");
    if (!location.trim()) {
      setError("Please select a destination district.");
      return;
    }

    const result = await fetchWeatherData(location.trim());
    if (result.cod !== 200) {
      setError(result.message || "Unable to fetch weather data.");
      setWeather(null);
      return;
    }

    setWeather(result);
  };

  return (
    <div className="page-content">
      <section className="page-section">
        <div className="section-header">
          <h1>Weather & Packing Planner</h1>
          <p>Get weather guidance and a smart packing list for your next destination.</p>
        </div>

        <div className="card card-form">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="input-field"
            >
              <option value="">Select destination district</option>
              {bangladeshDistricts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
            <button onClick={handleSearch} className="button-primary">
              Get Forecast
            </button>
          </div>
          {error && <div className="status-error mt-4">{error}</div>}
        </div>

        {weather && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card card-highlight lg:col-span-1">
              <h2>{weather.name}, {weather.sys.country}</h2>
              <p className="subtitle">{weather.weather[0].description}</p>
              <div className="weather-big">{Math.round(weather.main.temp)}°C</div>
              <div className="text-muted">Humidity: {weather.main.humidity}%</div>
              <div className="text-muted">Wind: {weather.wind.speed} m/s</div>
            </div>

            <div className="card card-highlight lg:col-span-2">
              <h3>Packing List</h3>
              <ul className="list-section">
                {packingList.map((item, index) => (
                  <li key={index} className="list-item">
                    <span>✔</span> {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="card card-highlight lg:col-span-3">
              <h3>Map Preview</h3>
              <iframe
                title="Destination Map"
                src={buildMapUrl(weather.coord.lat, weather.coord.lon)}
                className="map-frame"
                loading="lazy"
              />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
