const config = require('../config');
const { log } = require('../utils/logger');
const { degreesToDirection, formatPortugueseDate } = require('../utils/math');
const { sendGroupMessage } = require('./whatsappService');

// Estado interno do monitoramento
let lastAlertTimestamp = null;
let lastAlertWaveHeight = 0;
let isSwellActive = false;

/**
 * Reseta o estado do swell quando o mar baixa do gatilho
 */
const resetAlertState = () => {
  if (isSwellActive) {
    log('O mar baixou do gatilho. Estado de alerta resetado para o próximo swell.', 'info');
    isSwellActive = false;
    lastAlertWaveHeight = 0;
    lastAlertTimestamp = null; // Opcional: permite alerta imediato na próxima subida
  }
};

/**
 * Verifica se deve enviar o alerta baseado no tempo E na evolução da altura
 */
const shouldAlert = (currentHeight) => {
  // Caso 1: Novo swell ou reset após queda (Avisa na hora)
  if (!isSwellActive) {
    log(`Novo evento de swell detectado (${currentHeight}m).`, 'info');
    return true;
  }

  // Caso 2: Swell em andamento
  const now = Date.now();
  const cooldownMs = config.cooldownHours * 60 * 60 * 1000;
  const cooldownPassed = !lastAlertTimestamp || (now - lastAlertTimestamp) >= cooldownMs;
  const isRising = currentHeight > lastAlertWaveHeight;

  if (cooldownPassed && isRising) {
    log(`Cooldown de ${config.cooldownHours}h passou E o mar subiu (${lastAlertWaveHeight}m -> ${currentHeight}m).`, 'info');
    return true;
  }

  // Caso contrário, mantém silêncio
  if (!cooldownPassed) {
    log(`Swell ativo, mas aguardando cooldown de ${config.cooldownHours}h.`, 'info');
  } else {
    log(`Cooldown passou, mas o mar não subiu o suficiente (${currentHeight}m <= ${lastAlertWaveHeight}m).`, 'info');
  }
  
  return false;
};

const sendWhatsAppAlert = async (conditions) => {
  const { waveHeight, waveDirection, waveEnergy, windSpeed, windDirection, time } = conditions;

  if (!shouldAlert(waveHeight)) {
    return false;
  }

  const dateStr = formatPortugueseDate(time);
  const waveDirCard = degreesToDirection(waveDirection);
  const windDirCard = degreesToDirection(windDirection);
  
  const waveHeightFormatted = Number(waveHeight).toFixed(1);
  const waveEnergyFormatted = Number(waveEnergy).toLocaleString('pt-BR');

  const message = `*🌊 ALERTA DE SWELL - UBATUBA*

*Altura:* ${waveHeightFormatted}m
*Data:* ${dateStr}
*Direção do swell:* ${waveDirCard}
*Vento:* ${windSpeed} kts ${windDirCard}
*Energia da onda:* ${waveEnergyFormatted} J`;

  try {
    const sent = await sendGroupMessage(config.whatsappGroupName, message);
    if (sent) {
      lastAlertTimestamp = Date.now();
      lastAlertWaveHeight = waveHeight;
      isSwellActive = true;
      return true;
    }
    return false;
  } catch (error) {
    log(`Erro interno no envio do alerta: ${error.message}`, 'error');
    return false;
  }
};

module.exports = {
  sendWhatsAppAlert,
  resetAlertState
};
