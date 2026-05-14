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

    if (!response.data || !Array.isArray(response.data.hours)) {
      log('Resposta inválida do Stormglass: Propriedade "hours" não encontrada.', 'error');
      if (response.data) log(`Corpo da resposta: ${JSON.stringify(response.data).substring(0, 500)}...`, 'debug');
      throw new Error('Formato de resposta inesperado do Stormglass.');
    }

    const hourlyData = response.data.hours;
    
    // Função auxiliar para extrair valores do ECMWF com segurança
    // Retorna o valor se existir, ou null se não existir (diferente de undefined que causaria erro)
    const getVal = (obj) => {
      if (obj && typeof obj === 'object' && 'ecmwf' in obj && obj.ecmwf !== null && obj.ecmwf !== undefined) {
        return obj.ecmwf;
      }
      return null;
    };

    // 1. Encontrar o PICO de onda nos próximos 7 dias
    let maxWaveHeight = -1;
    let peakData = null;
    const dailyMaxes = {};

    hourlyData.forEach((hour) => {
      const h = getVal(hour.waveHeight);
      const d = getVal(hour.waveDirection);
      const ws = getVal(hour.windSpeed);
      const wd = getVal(hour.windDirection);

      // Só aceita o horário se tiver os dados básicos do swell e vento
      if (h === null || d === null || ws === null || wd === null) {
        return; 
      }

      const date = hour.time.split('T')[0];

      // Rastrear picos diários para o log
      if (!dailyMaxes[date] || h > dailyMaxes[date]) {
        dailyMaxes[date] = h;
      }

      // Rastrear o pico absoluto da semana
      if (h > maxWaveHeight) {
        maxWaveHeight = h;
        peakData = {
          time: hour.time,
          waveHeight: h,
          waveDirection: d,
          windSpeed: ws,
          windDirection: wd
        };
      }
    });

    if (Object.keys(dailyMaxes).length > 0) {
      log('Picos diários detectados (Stormglass ECMWF):', 'info');
      Object.entries(dailyMaxes).forEach(([date, peak]) => {
        log(`${date}: ${peak}m`, 'info');
      });
    }

    if (!peakData) {
      log(`Dados brutos da primeira hora: ${JSON.stringify(hourlyData[0])}`, 'debug');
      throw new Error('Nenhum dado de pico completo encontrado no Stormglass para o modelo ECMWF.');
    }

    return {
      time: peakData.time,
      waveHeight: peakData.waveHeight,
      waveDirection: peakData.waveDirection,
      waveEnergy: calculateWaveEnergy(peakData.waveHeight),
      windSpeed: Math.round(peakData.windSpeed * 1.94384), // Converte m/s para knots e arredonda
      windDirection: peakData.windDirection,
      isForecast: true
    };

  } catch (error) {
    if (error.response && error.response.status === 429) {
      throw new Error('Limite de taxa do Stormglass atingido (10/dia).');
    }
    // Log detalhado para erros de parsing
    if (error instanceof TypeError) {
      log(`Erro de tipo detectado no parsing: ${error.stack}`, 'error');
    }
    throw new Error(`Erro no Stormglass: ${error.message}`);
  }
};

module.exports = {
  getCurrentConditions
};
