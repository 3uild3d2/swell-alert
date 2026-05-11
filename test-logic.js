const { sendWhatsAppAlert, resetAlertState } = require('./src/services/alertService');
const { log } = require('./src/utils/logger');

// Mock da função de envio para não precisar de WhatsApp no teste de lógica
const whatsappService = require('./src/services/whatsappService');
whatsappService.sendGroupMessage = async () => true; 

async function runLogicTest() {
  console.log('\n=== INICIANDO TESTE DE LÓGICA DO SWELL ===\n');

  const baseConditions = {
    waveDirection: 140,
    waveEnergy: 1500,
    windSpeed: 10,
    windDirection: 180,
    time: new Date().toISOString()
  };

  // 1. Mar sobe para 1.5m (Gatilho é 1.4m)
  console.log('--- TESTE 1: Mar subiu para 1.5m ---');
  await sendWhatsAppAlert({ ...baseConditions, waveHeight: 1.5 });

  // 2. Mar sobe para 1.6m mas em menos de 6 horas
  console.log('\n--- TESTE 2: Mar subiu para 1.6m (Ainda em cooldown) ---');
  await sendWhatsAppAlert({ ...baseConditions, waveHeight: 1.6 });

  // 3. Mar baixa para 1.0m (Abaixo do gatilho)
  console.log('\n--- TESTE 3: Mar baixou para 1.0m (Reset) ---');
  resetAlertState();

  // 4. Mar volta para 1.4m (Deve alertar mesmo sem passar 6h do primeiro)
  console.log('\n--- TESTE 4: Mar subiu para 1.4m após o reset ---');
  await sendWhatsAppAlert({ ...baseConditions, waveHeight: 1.4 });

  console.log('\n=== FIM DO TESTE ===');
}

runLogicTest();
