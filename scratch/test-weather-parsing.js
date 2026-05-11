
const { calculateWaveEnergy } = require('../src/utils/math');

// Mock da função getVal e a lógica de loop para testar sem chamar a API real
const getVal = (obj) => {
  if (obj && typeof obj === 'object' && 'ecmwf' in obj && obj.ecmwf !== null && obj.ecmwf !== undefined) {
    return obj.ecmwf;
  }
  return null;
};

function testParsing(hours) {
    let maxWaveHeight = -1;
    let peakData = null;

    hours.forEach((hour) => {
      const h = getVal(hour.waveHeight);
      const d = getVal(hour.waveDirection);
      const ws = getVal(hour.windSpeed);
      const wd = getVal(hour.windDirection);

      if (h === null || d === null || ws === null || wd === null) {
        console.log(`Pulo: Dado incompleto em ${hour.time}`);
        return; 
      }

      if (h > maxWaveHeight) {
        maxWaveHeight = h;
        peakData = {
          time: hour.time,
          waveHeight: h,
          waveDirection: d,
          windSpeed: ws,
          windDirection: wd
        };
      }
    });

    return peakData;
}

// CENÁRIOS DE TESTE
const scenarios = [
    {
        name: "Dados Perfeitos",
        data: [
            { time: "2026-05-11T12:00:00Z", waveHeight: { ecmwf: 1.5 }, waveDirection: { ecmwf: 140 }, windSpeed: { ecmwf: 5 }, windDirection: { ecmwf: 180 } }
        ]
    },
    {
        name: "Valores Zero (Devem ser aceitos)",
        data: [
            { time: "2026-05-11T12:00:00Z", waveHeight: { ecmwf: 0 }, waveDirection: { ecmwf: 0 }, windSpeed: { ecmwf: 0 }, windDirection: { ecmwf: 0 } }
        ]
    },
    {
        name: "Propriedade ecmwf ausente (Deve pular)",
        data: [
            { time: "2026-05-11T12:00:00Z", waveHeight: { noaa: 1.5 }, waveDirection: { ecmwf: 140 }, windSpeed: { ecmwf: 5 }, windDirection: { ecmwf: 180 } }
        ]
    },
    {
        name: "Propriedade waveHeight undefined (Deve pular sem erro)",
        data: [
            { time: "2026-05-11T12:00:00Z", waveDirection: { ecmwf: 140 }, windSpeed: { ecmwf: 5 }, windDirection: { ecmwf: 180 } }
        ]
    },
    {
        name: "Propriedade waveHeight null (Deve pular sem erro)",
        data: [
            { time: "2026-05-11T12:00:00Z", waveHeight: null, waveDirection: { ecmwf: 140 }, windSpeed: { ecmwf: 5 }, windDirection: { ecmwf: 180 } }
        ]
    }
];

scenarios.forEach(s => {
    console.log(`\n--- Testando: ${s.name} ---`);
    try {
        const result = testParsing(s.data);
        if (result) {
            console.log("Sucesso! Pico encontrado:", result);
        } else {
            console.log("Aviso: Nenhum pico encontrado (comportamento esperado para alguns casos)");
        }
    } catch (e) {
        console.error("ERRO CRÍTICO:", e.message);
        console.error(e.stack);
    }
});
