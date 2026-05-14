/**
 * Converte graus (0-360) para direções cardeais
 */
const degreesToDirection = (degrees) => {
  const directions = [
    'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'
  ];
  const val = Math.floor((degrees / 22.5) + 0.5);
  return directions[(val % 16)];
};

/**
 * Calcula a energia da onda em Joules por metro quadrado.
 * Fórmula aproximada: E = 1/8 * ρ * g * H²
 * Onde ρ (densidade da água do mar) ≈ 1025 kg/m³
 * g (gravidade) ≈ 9.81 m/s²
 * Resultando em E ≈ 1256.9 * H²
 */
const calculateWaveEnergy = (waveHeight) => {
  const energy = 1256.9 * Math.pow(waveHeight, 2);
  return Math.round(energy);
};

/**
 * Formata a data atual em português
 */
const formatPortugueseDate = (dateString) => {
  const targetDate = dateString ? new Date(dateString) : new Date();
  const now = new Date();
  
  // Função para zerar o horário para comparação apenas de data
  const resetTime = (d) => {
    const newDate = new Date(d);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
  };

  const todayReset = resetTime(now);
  const targetReset = resetTime(targetDate);
  
  const diffTime = targetReset.getTime() - todayReset.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  let relativeStr = '';
  if (diffDays === 0) {
    relativeStr = '(hoje)';
  } else if (diffDays === 1) {
    relativeStr = '(amanhã)';
  } else if (diffDays > 1) {
    relativeStr = `(em ${diffDays} dias)`;
  } else if (diffDays < 0) {
    relativeStr = '(passado)'; // Apenas para segurança, não deve ocorrer no forecast
  }

  const daysOfWeek = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const dayOfWeek = daysOfWeek[targetDate.getDay()];
  const dayOfMonth = targetDate.getDate();
  
  return `${dayOfWeek}, dia ${dayOfMonth} ${relativeStr}`.trim();
};

module.exports = {
  degreesToDirection,
  calculateWaveEnergy,
  formatPortugueseDate
};
