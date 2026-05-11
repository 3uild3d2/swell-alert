const axios = require('axios');
const config = require('../config');
const { calculateWaveEnergy } = require('../utils/math');
const { log } = require('../utils/logger');

const getCurrentConditions = async () => {
  try {
    // 1. Busca previsão de 7 dias usando o modelo ECMWF IFS (Padrão Windy)
    const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${config.latitude}&longitude=${config.longitude}&hourly=wave_height,wave_direction,wave_period&models=ecmwf_ifs&timezone=America%2FSao_Paulo`;
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${config.latitude}&longitude=${config.longitude}&hourly=wind_speed_10m,wind_direction_10m&models=ecmwf_ifs&wind_speed_unit=kn&timezone=America%2FSao_Paulo`;

    const [marineRes, weatherRes] = await Promise.all([
      axios.get(marineUrl),
      axios.get(weatherUrl)
    ]);

    const hourlyMarine = marineRes.data.hourly;
    const hourlyWeather = weatherRes.data.hourly;

    // Helper para extrair dados mesmo quando o nome da chave muda (ex: wave_height_ecmwf_ifs)
    const getHourlyData = (obj, prefix) => {
      const key = Object.keys(obj).find(k => k.startsWith(prefix));
      return obj[key];
    };

    const waveHeights = getHourlyData(hourlyMarine, 'wave_height');
    const waveDirections = getHourlyData(hourlyMarine, 'wave_direction');
    const windSpeeds = getHourlyData(hourlyWeather, 'wind_speed_10m');
    const windDirections = getHourlyData(hourlyWeather, 'wind_direction_10m');

    // 2. Encontra o PICO de onda nos próximos 7 dias
    let maxWaveHeight = -1;
    let peakIndex = 0;

    const dailyMaxes = {};
    
    waveHeights.forEach((height, index) => {
      const date = hourlyMarine.time[index].split('T')[0];
      if (!dailyMaxes[date] || height > dailyMaxes[date]) {
        dailyMaxes[date] = height;
      }

      if (height > maxWaveHeight) {
        maxWaveHeight = height;
        peakIndex = index;
      }
    });

    log('Picos detectados para a semana (Modelo ECMWF):', 'info');
    Object.entries(dailyMaxes).forEach(([date, peak]) => {
      log(`${date}: ${peak}m`, 'info');
    });

    // 3. Extrai os dados completos do momento desse pico
    const waveHeight = waveHeights[peakIndex];
    const waveDirection = waveDirections[peakIndex];
    const waveEnergy = calculateWaveEnergy(waveHeight);
    
    const windSpeed = windSpeeds[peakIndex];
    const windDirection = windDirections[peakIndex];
    const time = hourlyMarine.time[peakIndex];

    return {
      time,
      waveHeight,
      waveDirection,
      waveEnergy,
      windSpeed,
      windDirection,
      isForecast: true // Flag para indicar que é uma previsão
    };
  } catch (error) {
    throw new Error(`Erro ao buscar dados de previsão: ${error.message}`);
  }
};

module.exports = {
  getCurrentConditions
};
