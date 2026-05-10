require('dotenv').config();

module.exports = {
  whatsappGroupName: process.env.WHATSAPP_GROUP_NAME || 'Seu Grupo Aqui',
  latitude: parseFloat(process.env.LATITUDE) || -23.559,
  longitude: parseFloat(process.env.LONGITUDE) || -45.120,
  triggerWaveHeight: parseFloat(process.env.TRIGGER_WAVE_HEIGHT) || 1.4,
  cooldownHours: parseInt(process.env.COOLDOWN_HOURS) || 24,
  port: parseInt(process.env.PORT) || 3000,
};
