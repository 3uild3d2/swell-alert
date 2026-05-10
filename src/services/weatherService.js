const axios = require('axios');
const config = require('../config');
const { calculateWaveEnergy } = require('../utils/math');

const fetchMarineData = async () => {
  const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${config.latitude}&longitude=${config.longitude}&current=wave_height,wave_direction,wave_period&timezone=America%2FSao_Paulo`;
  const response = await axios.get(url);
  return response.data.current;
};

const fetchWeatherData = async () => {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${config.latitude}&longitude=${config.longitude}&current=wind_speed_10m,wind_direction_10m&wind_speed_unit=kn&timezone=America%2FSao_Paulo`;
  const response = await axios.get(url);
  return response.data.current;
};

const getCurrentConditions = async () => {
  try {
    const [marine, weather] = await Promise.all([
      fetchMarineData(),
      fetchWeatherData()
    ]);

    const waveHeight = marine.wave_height;
    const waveDirection = marine.wave_direction;
    const waveEnergy = calculateWaveEnergy(waveHeight);
    
    const windSpeed = weather.wind_speed_10m;
    const windDirection = weather.wind_direction_10m;

    return {
      time: marine.time,
      waveHeight,
      waveDirection,
      waveEnergy,
      windSpeed,
      windDirection
    };
  } catch (error) {
    throw new Error(`Erro ao buscar dados do Open-Meteo: ${error.message}`);
  }
};

module.exports = {
  getCurrentConditions
};
