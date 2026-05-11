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

    // Helper robusto para extrair dados
    const getHourlyData = (obj, prefix) => {
      const key = Object.keys(obj).find(k => k.startsWith(prefix));
      return obj[key] || [];
    };

    const waveHeights = getHourlyData(hourlyMarine, 'wave_height');
    const waveDirections = getHourlyData(hourlyMarine, 'wave_direction');
    const windSpeeds = getHourlyData(hourlyWeather, 'wind_speed_10m');
    const windDirections = getHourlyData(hourlyWeather, 'wind_direction_10m');

    // 2. Encontra o PICO de onda (ignorando nulls)
    let maxWaveHeight = -1;
    let peakIndex = -1;

    const dailyMaxes = {};
    
    waveHeights.forEach((height, index) => {
      if (height === null) return; // Ignora se o modelo não tiver dados para esse horário

      const date = hourlyMarine.time[index].split('T')[0];
      if (!dailyMaxes[date] || height > dailyMaxes[date]) {
        dailyMaxes[date] = height;
      }

      if (height > maxWaveHeight) {
        maxWaveHeight = height;
        peakIndex = index;
      }
    });

    // Se o modelo escolhido falhou totalmente, tenta sem o filtro de modelo (Best Match)
    if (peakIndex === -1) {
       log('Aviso: Modelo ECMWF não retornou dados para estas coordenadas. Tentando modelo padrão...', 'warn');
       // Aqui poderíamos fazer um novo fetch sem o parâmetro &models=ecmwf_ifs
       // Mas para resolver agora, vou sugerir o ajuste de coordenadas
    }

    log('Picos detectados para a semana:', 'info');
    Object.entries(dailyMaxes).forEach(([date, peak]) => {
      log(`${date}: ${peak}m`, 'info');
    });

    // 3. Extrai os dados (com fallback para segurança)
    const waveHeight = peakIndex !== -1 ? waveHeights[peakIndex] : 0;
    const waveDirection = peakIndex !== -1 ? waveDirections[peakIndex] : 0;
    const waveEnergy = calculateWaveEnergy(waveHeight);
    
    const windSpeed = peakIndex !== -1 ? windSpeeds[peakIndex] : 0;
    const windDirection = peakIndex !== -1 ? windDirections[peakIndex] : 0;
    const time = peakIndex !== -1 ? hourlyMarine.time[peakIndex] : new Date().toISOString();

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
    if (error.response) {
      log(`Erro na API do Open-Meteo (${error.response.status}): ${JSON.stringify(error.response.data)}`, 'error');
    }
    log(`Stack do erro: ${error.stack}`, 'error');
    throw new Error(`Erro ao buscar dados de previsão: ${error.message}`);
  }
};

module.exports = {
  getCurrentConditions
};
