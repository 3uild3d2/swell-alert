const cron = require('node-cron');
const express = require('express');
const config = require('./src/config');
const { log } = require('./src/utils/logger');
const { getCurrentConditions } = require('./src/services/weatherService');
const { sendWhatsAppAlert, resetAlertState } = require('./src/services/alertService');
const { connectToWhatsApp } = require('./src/services/whatsappService');

// Inicializa o app Express (necessário para plataformas como Render/Koyeb manterem o app vivo)
const app = express();

app.get('/', (req, res) => {
  res.send('Swell Alert Bot está rodando e conectado ao WhatsApp!');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', time: new Date().toISOString() });
});

// Inicia o servidor HTTP
app.listen(config.port, () => {
  log(`Servidor rodando na porta ${config.port}`, 'info');
});

// Lógica principal de monitoramento
const checkSwell = async () => {
  log('Iniciando verificação das condições marítimas...', 'info');
  
  try {
    const conditions = await getCurrentConditions();
    
    log(`Dados recebidos: Altura=${conditions.waveHeight}m, Dir=${conditions.waveDirection}°, Energia=${conditions.waveEnergy}J, Vento=${conditions.windSpeed}kts`, 'info');

    if (conditions.waveHeight >= config.triggerWaveHeight) {
      log(`Gatilho atingido! Ondas de ${conditions.waveHeight}m (>= ${config.triggerWaveHeight}m).`, 'warn');
      await sendWhatsAppAlert(conditions);
    } else {
      resetAlertState();
      log(`Condições normais. Ondas de ${conditions.waveHeight}m (Abaixo do gatilho de ${config.triggerWaveHeight}m).`, 'info');
    }
    
  } catch (error) {
    log(`Erro no ciclo de verificação: ${error.message}`, 'error');
  }
};

// Inicialização
const start = async () => {
  // 1. Conecta ao WhatsApp
  log('Iniciando conexão com o WhatsApp...', 'info');
  await connectToWhatsApp();

  // 2. Agenda a verificação para rodar 4 vezes ao dia (00:00, 06:00, 12:00, 18:00 Brasília)
  // Como o servidor geralmente roda em UTC, usamos 03, 09, 15, 21.
  // Isso economiza os créditos da Stormglass API (Limite 10/dia)
  cron.schedule('0 3,9,15,21 * * *', () => {
    checkSwell();
  });

  log('Swell Alert Bot inicializado. Monitoramento agendado (00h, 06h, 12h, 18h).', 'info');
};

start();
