require('dotenv').config();
const { getCurrentConditions } = require('./src/services/weatherService');
const { sendWhatsAppAlert } = require('./src/services/alertService');
const { connectToWhatsApp } = require('./src/services/whatsappService');
const { log } = require('./src/utils/logger');

async function runTest() {
  try {
    log('=== INICIANDO TESTE REAL (STORMGLASS + WHATSAPP) ===', 'info');

    // 1. Conecta ao WhatsApp
    log('Conectando ao WhatsApp...', 'info');
    await connectToWhatsApp();

    // Aguarda um pouco para a conexão estabilizar
    log('Aguardando estabilização da conexão (10s)...', 'info');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // 2. Busca condições no Stormglass
    log('Buscando dados no Stormglass...', 'info');
    const conditions = await getCurrentConditions();

    log(`PICO ENCONTRADO: ${conditions.waveHeight}m em ${conditions.time}`, 'info');

    // 3. Tenta enviar o alerta
    log('Processando alerta...', 'info');
    const sent = await sendWhatsAppAlert(conditions);

    if (sent) {
      log('TESTE CONCLUÍDO: Alerta enviado com sucesso!', 'info');
    } else {
      log('TESTE CONCLUÍDO: Alerta não enviado (Abaixo do gatilho ou cooldown).', 'info');
    }

  } catch (error) {
    log(`ERRO NO TESTE: ${error.message}`, 'error');
  }
}

runTest();
