const config = require('../config');
const { log } = require('../utils/logger');
const { degreesToDirection, formatPortugueseDate } = require('../utils/math');
const { sendGroupMessage } = require('./whatsappService');

// Armazena o timestamp do último alerta enviado
let lastAlertTimestamp = null;

const checkCooldown = () => {
  if (!lastAlertTimestamp) return true; // Nunca enviou
  
  const now = Date.now();
  const cooldownMs = config.cooldownHours * 60 * 60 * 1000;
  
  return (now - lastAlertTimestamp) >= cooldownMs;
};

const sendWhatsAppAlert = async (conditions) => {
  if (!checkCooldown()) {
    log(`Alerta não enviado: Cooldown de ${config.cooldownHours}h ainda ativo.`, 'info');
    return false;
  }

  const { waveHeight, waveDirection, waveEnergy, windSpeed, windDirection, time } = conditions;

  const dateStr = formatPortugueseDate(time);
  const waveDirCard = degreesToDirection(waveDirection);
  const windDirCard = degreesToDirection(windDirection);
  
  const waveHeightFormatted = Number(waveHeight).toFixed(1);
  const waveEnergyFormatted = Number(waveEnergy).toLocaleString('pt-BR');

  // Formato da mensagem desejado pelo usuário
  const message = `*🌊 ALERTA DE SWELL - UBATUBA*

*Altura:* ${waveHeightFormatted}m
*Data:* ${dateStr}
*Direção do swell:* ${waveDirCard}
*Vento:* ${windSpeed}kts ${windDirCard}
*Energia da onda:* ${waveEnergyFormatted} J`;

  try {
    const sent = await sendGroupMessage(config.whatsappGroupName, message);
    if (sent) {
      lastAlertTimestamp = Date.now();
      return true;
    }
    return false;
  } catch (error) {
    log(`Erro interno no envio do alerta: ${error.message}`, 'error');
    return false;
  }
};

module.exports = {
  sendWhatsAppAlert
};
