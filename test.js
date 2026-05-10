require('dotenv').config();
const { sendWhatsAppAlert } = require('./src/services/alertService');
const { connectToWhatsApp } = require('./src/services/whatsappService');

const runTest = async () => {
  console.log('Iniciando conexão com WhatsApp para teste...');
  await connectToWhatsApp();

  // Espera 10 segundos para dar tempo de conectar ou escanear o QR Code
  console.log('Aguardando 15 segundos para estabelecer a conexão...');
  
  setTimeout(async () => {
    console.log('Testando a formatação e envio do alerta para o grupo...');
    
    const mockConditions = {
      waveHeight: 1.6,
      waveDirection: 155, // SSE
      waveEnergy: 3217,
      windSpeed: 12,
      windDirection: 45, // NE
      time: new Date().toISOString()
    };

    // Temporariamente ignora o cooldown para forçar o envio
    await sendWhatsAppAlert(mockConditions);
    console.log('Teste concluído. Se a mensagem não chegou, verifique os logs acima.');
    process.exit(0);
  }, 15000);
};

runTest();
