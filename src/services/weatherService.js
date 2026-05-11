const axios = require('axios');
const config = require('../config');
const { calculateWaveEnergy } = require('../utils/math');
const { log } = require('../utils/logger');

const getCurrentConditions = async () => {
  try {
    const params = 'waveHeight,waveDirection,windSpeed,windDirection';
    const url = `https://api.stormglass.io/v2/weather/point?lat=${config.latitude}&lng=${config.longitude}&params=${params}&source=ecmwf`;

    log(`Buscando dados no Stormglass (ECMWF)...`, 'info');
    
    const response = await axios.get(url, {
      headers: { 'Authorization': config.stormglassApiKey }
    });

    const hourlyData = response.data.hours;
    
    // 1. Encontrar o PICO de onda nos próximos 7 dias
    let maxWaveHeight = -1;
    let peakData = null;
    const dailyMaxes = {};

    hourlyData.forEach((hour) => {
      const height = hour.waveHeight.ecmwf;
      const date = hour.time.split('T')[0];

      // Rastrear picos diários para o log
      if (!dailyMaxes[date] || height > dailyMaxes[date]) {
        dailyMaxes[date] = height;
      }

      // Rastrear o pico absoluto da semana
      if (height > maxWaveHeight) {
        maxWaveHeight = height;
        peakData = hour;
      }
    });

    log('Picos diários detectados (Stormglass ECMWF):', 'info');
    Object.entries(dailyMaxes).forEach(([date, peak]) => {
      log(`${date}: ${peak}m`, 'info');
    });

    if (!peakData) throw new Error('Nenhum dado de pico encontrado no Stormglass.');

    return {
      time: peakData.time,
      waveHeight: peakData.waveHeight.ecmwf,
      waveDirection: peakData.waveDirection.ecmwf,
      waveEnergy: calculateWaveEnergy(peakData.waveHeight.ecmwf),
      windSpeed: peakData.windSpeed.ecmwf * 1.94384, // Converte m/s para knots (Stormglass usa m/s)
      windDirection: peakData.windDirection.ecmwf,
      isForecast: true
    };

  } catch (error) {
    if (error.response && error.response.status === 429) {
      throw new Error('Limite de taxa do Stormglass atingido (10/dia).');
    }
    throw new Error(`Erro no Stormglass: ${error.message}`);
  }
};

module.exports = {
  getCurrentConditions
};
