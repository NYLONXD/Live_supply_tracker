// components/ETAPredictor.jsx
import React, { useState } from 'react';
import axios from 'axios';

const ETAPredictor = () => {
  const [formData, setFormData] = useState({
    distance: '',
    base_speed: '',
    traffic_factor: '',
    vehicle: 'Car',
    weather: 'Clear',
    route: 'A',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('http://127.0.0.1:8000/predict', {
        ...formData,
        distance: parseFloat(formData.distance),
        base_speed: parseFloat(formData.base_speed),
        traffic_factor: parseFloat(formData.traffic_factor),
      });
      setResult(response.data);
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/10 border border-purple-600/40 backdrop-blur-xl p-6 rounded-2xl shadow-2xl hover:shadow-purple-700/50 transition-all">
      <h3 className="text-xl font-bold text-indigo-300 mb-4">⏱️ ETA Prediction</h3>
      <form onSubmit={handlePredict} className="grid grid-cols-2 gap-4 text-black">
        <input type="number" step="0.1" name="distance" placeholder="Distance (km)" value={formData.distance} onChange={handleChange} required className="rounded p-2" />
        <input type="number" step="0.1" name="base_speed" placeholder="Base Speed (km/h)" value={formData.base_speed} onChange={handleChange} required className="rounded p-2" />
        <input type="number" step="0.1" name="traffic_factor" placeholder="Traffic Factor (e.g. 1.2)" value={formData.traffic_factor} onChange={handleChange} required className="rounded p-2" />
        
        <select name="vehicle" value={formData.vehicle} onChange={handleChange} className="rounded p-2">
          <option value="Car">🚗 Car</option>
          <option value="Bike">🏍️ Bike</option>
          <option value="Truck">🚛 Truck</option>
        </select>
        <select name="weather" value={formData.weather} onChange={handleChange} className="rounded p-2">
          <option value="Clear">☀️ Clear</option>
          <option value="Rainy">🌧️ Rainy</option>
          <option value="Foggy">🌫️ Foggy</option>
        </select>
        <select name="route" value={formData.route} onChange={handleChange} className="rounded p-2">
          <option value="A">🛣️ Route A</option>
          <option value="B">🛣️ Route B</option>
          <option value="C">🛣️ Route C</option>
        </select>

        <button
          type="submit"
          disabled={loading}
          className="col-span-2 mt-2 py-2 rounded bg-purple-600 text-white hover:bg-purple-700 transition-all"
        >
          {loading ? 'Predicting...' : 'Get ETA'}
        </button>
      </form>

      {result && (
        <div className="mt-4 text-indigo-100 text-sm">
          {result.error ? (
            <p className="text-red-400">❌ Error: {result.error}</p>
          ) : (
            <>
              <p>🕒 Estimated ETA: <strong>{result.estimated_eta_minutes} minutes</strong></p>
              <p>📉 Range: {result.eta_range.lower} – {result.eta_range.upper} minutes</p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ETAPredictor;
