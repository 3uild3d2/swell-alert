const log = (message, type = 'info') => {
  const timestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const formattedMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;

  switch (type) {
    case 'error':
      console.error(formattedMessage);
      break;
    case 'warn':
      console.warn(formattedMessage);
      break;
    default:
      console.log(formattedMessage);
  }
};

module.exports = { log };
