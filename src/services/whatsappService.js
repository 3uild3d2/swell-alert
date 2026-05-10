const { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const { log } = require('../utils/logger');
const fs = require('fs');
const path = require('path');

let sock = null;
let isConnected = false;

const connectToWhatsApp = async () => {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
  const { version, isLatest } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    printQRInTerminal: false, // Nós vamos imprimir customizado para ter mais controle
    auth: state,
    logger: pino({ level: 'silent' }) // Silencia os logs do Baileys para não poluir
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      log('Leia o QR Code abaixo com o seu WhatsApp:', 'info');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
      log(`Conexão fechada. Motivo: ${lastDisconnect.error?.message}. Reconectando: ${shouldReconnect}`, 'warn');
      isConnected = false;
      
      if (shouldReconnect) {
        connectToWhatsApp();
      } else {
        log('Você foi deslogado do WhatsApp. Delete a pasta auth_info_baileys e rode novamente para gerar um novo QR Code.', 'error');
      }
    } else if (connection === 'open') {
      log('WhatsApp conectado com sucesso!', 'info');
      isConnected = true;
    }
  });
};

const sendGroupMessage = async (groupName, message) => {
  if (!isConnected || !sock) {
    log('WhatsApp não está conectado. Mensagem não enviada.', 'error');
    return false;
  }

  try {
    // Busca todos os grupos que o bot faz parte
    const groups = Object.values(await sock.groupFetchAllParticipating());
    
    // Procura o grupo cujo nome inclua o texto configurado (case-insensitive)
    // Usamos .includes() para facilitar caso o grupo tenha emojis difíceis de digitar no .env
    const targetGroup = groups.find(g => 
      g.subject.toLowerCase().includes(groupName.trim().toLowerCase())
    );

    if (!targetGroup) {
      const groupNames = groups.map(g => g.subject).join(', ');
      log(`Grupo "${groupName}" não encontrado. O bot encontrou os seguintes grupos: [${groupNames || 'Nenhum grupo encontrado'}]`, 'error');
      return false;
    }

    // Envia a mensagem para o JID (id) do grupo
    await sock.sendMessage(targetGroup.id, { text: message });
    log(`Mensagem enviada com sucesso para o grupo: ${targetGroup.subject}`, 'info');
    return true;

  } catch (error) {
    log(`Erro ao enviar mensagem no WhatsApp: ${error.message}`, 'error');
    return false;
  }
};

module.exports = {
  connectToWhatsApp,
  sendGroupMessage
};
