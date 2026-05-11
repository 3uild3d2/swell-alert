const axios = require('axios');
const config = require('../config');
const { calculateWaveEnergy } = require('../utils/math');
const { log } = require('../utils/logger');

const getCurrentConditions = async () => {
  try {
    // 1. Busca previsão de 7 dias para Mar e Vento (Horário)
    const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${config.latitude}&longitude=${config.longitude}&hourly=wave_height,wave_direction,wave_period&timezone=America%2FSao_Paulo`;
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${config.latitude}&longitude=${config.longitude}&hourly=wind_speed_10m,wind_direction_10m&wind_speed_unit=kn&timezone=America%2FSao_Paulo`;

    const [marineRes, weatherRes] = await Promise.all([
      axios.get(marineUrl),
      axios.get(weatherUrl)
    ]);

    const hourlyMarine = marineRes.data.hourly;
    const hourlyWeather = weatherRes.data.hourly;

    // 2. Encontra o PICO de onda nos próximos 7 dias
    let maxWaveHeight = -1;
    let peakIndex = 0;

    // Log para depuração (ver picos diários)
    const dailyMaxes = {};
    
    hourlyMarine.wave_height.forEach((height, index) => {
      const date = hourlyMarine.time[index].split('T')[0];
      if (!dailyMaxes[date] || height > dailyMaxes[date]) {
        dailyMaxes[date] = height;
      }

      if (height > maxWaveHeight) {
        maxWaveHeight = height;
        peakIndex = index;
      }
    });

    log('Picos detectados para a semana:', 'info');
    Object.entries(dailyMaxes).forEach(([date, peak]) => {
      log(`${date}: ${peak}m`, 'info');
    });

    // 3. Extrai os dados completos do momento desse pico
    const waveHeight = hourlyMarine.wave_height[peakIndex];
    const waveDirection = hourlyMarine.wave_direction[peakIndex];
    const waveEnergy = calculateWaveEnergy(waveHeight);
    
    // O vento no momento do pico da onda
    const windSpeed = hourlyWeather.wind_speed_10m[peakIndex];
    const windDirection = hourlyWeather.wind_direction_10m[peakIndex];
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
