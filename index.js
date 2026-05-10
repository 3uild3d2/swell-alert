const cron = require('node-cron');
const express = require('express');
const config = require('./src/config');
const { log } = require('./src/utils/logger');
const { getCurrentConditions } = require('./src/services/weatherService');
const { sendWhatsAppAlert } = require('./src/services/alertService');
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

  // 2. Agenda a verificação para rodar a cada 30 minutos ("*/30 * * * *")
  cron.schedule('*/30 * * * *', () => {
    checkSwell();
  });

  // 3. Aguarda uns segundos e roda a primeira verificação pra garantir
  setTimeout(() => {
    log('Swell Alert Bot inicializado. Monitoramento ativo.', 'info');
    checkSwell();
  }, 10000); // 10 segundos pra dar tempo de ler o QR code caso seja a primeira vez
};

start();
