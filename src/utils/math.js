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
  const date = dateString ? new Date(dateString) : new Date();
  
  const daysOfWeek = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const dayOfWeek = daysOfWeek[date.getDay()];
  const dayOfMonth = date.getDate();
  
  // Como estamos verificando as condições atuais, será "hoje"
  return `${dayOfWeek}, dia ${dayOfMonth} (hoje)`;
};

module.exports = {
  degreesToDirection,
  calculateWaveEnergy,
  formatPortugueseDate
};
