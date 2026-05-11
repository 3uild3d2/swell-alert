const axios = require('axios');
const config = require('../config');
const { calculateWaveEnergy } = require('../utils/math');
const { log } = require('../utils/logger');

const getCurrentConditions = async () => {
  const fetchFromApi = async (useEcmwf = true) => {
    const modelParam = useEcmwf ? '&models=ecmwf_ifs' : '';
    const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${config.latitude}&longitude=${config.longitude}&hourly=wave_height,wave_direction,wave_period${modelParam}&timezone=America%2FSao_Paulo`;
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${config.latitude}&longitude=${config.longitude}&hourly=wind_speed_10m,wind_direction_10m${modelParam}&wind_speed_unit=kn&timezone=America%2FSao_Paulo`;

    const [marineRes, weatherRes] = await Promise.all([
      axios.get(marineUrl),
      axios.get(weatherUrl)
    ]);

    return { 
      hourlyMarine: marineRes.data.hourly, 
      hourlyWeather: weatherRes.data.hourly 
    };
  };

  try {
    // 1. Tenta com o modelo ECMWF (Windy)
    let { hourlyMarine, hourlyWeather } = await fetchFromApi(true);

    // Helper robusto para extrair dados
    const getHourlyData = (obj, prefix) => {
      const key = Object.keys(obj).find(k => k.startsWith(prefix));
      return obj[key] || [];
    };

    let waveHeights = getHourlyData(hourlyMarine, 'wave_height');
    
    // 2. Se o ECMWF falhou (tudo null), tenta o modelo padrão
    const isEcmwfEmpty = waveHeights.every(h => h === null);
    if (isEcmwfEmpty) {
      log('Modelo ECMWF sem dados para esta coordenada. Usando modelo padrão (Best Match)...', 'warn');
      const fallback = await fetchFromApi(false);
      hourlyMarine = fallback.hourlyMarine;
      hourlyWeather = fallback.hourlyWeather;
      waveHeights = getHourlyData(hourlyMarine, 'wave_height');
    }

    const waveDirections = getHourlyData(hourlyMarine, 'wave_direction');
    const windSpeeds = getHourlyData(hourlyWeather, 'wind_speed_10m');
    const windDirections = getHourlyData(hourlyWeather, 'wind_direction_10m');

    // 3. Encontra o PICO de onda
    let maxWaveHeight = -1;
    let peakIndex = 0;
    const dailyMaxes = {};
    
    waveHeights.forEach((height, index) => {
      if (height === null) return;
      const date = hourlyMarine.time[index].split('T')[0];
      if (!dailyMaxes[date] || height > dailyMaxes[date]) dailyMaxes[date] = height;
      if (height > maxWaveHeight) {
        maxWaveHeight = height;
        peakIndex = index;
      }
    });

    log('Picos detectados para a semana:', 'info');
    Object.entries(dailyMaxes).forEach(([date, peak]) => {
      log(`${date}: ${peak}m`, 'info');
    });

    // 4. Extrai os dados finais
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
