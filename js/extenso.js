/**
 * Conversor de valores numéricos para extenso em Português do Brasil.
 * Especializado para recibos formais (usando "Hum mil" conforme tradição jurídica/contábil).
 */

const UNIDADES = [
  '', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove',
  'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'
];

const DEZENAS = [
  '', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'
];

const CENTENAS = [
  '', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'
];

function converterGrupo(n) {
  if (n === 0) return '';
  if (n === 100) return 'cem';

  const c = Math.floor(n / 100);
  const d = Math.floor((n % 100) / 10);
  const u = n % 10;
  const partes = [];

  if (c > 0) partes.push(CENTENAS[c]);

  const resto = n % 100;
  if (resto > 0) {
    if (resto < 20) {
      partes.push(UNIDADES[resto]);
    } else {
      partes.push(DEZENAS[d]);
      if (u > 0) partes.push(UNIDADES[u]);
    }
  }

  return partes.join(' e ');
}

export function numeroPorExtenso(valor, options = { usarHumMil: true }) {
  if (isNaN(valor) || valor === null) return '';
  
  const v = Math.round(valor * 100) / 100;
  const inteiro = Math.floor(v);
  const centavos = Math.round((v - inteiro) * 100);

  if (inteiro === 0 && centavos === 0) return 'zero reais';

  const partes = [];

  if (inteiro > 0) {
    // Milhões
    const milhoes = Math.floor(inteiro / 1000000);
    const milhares = Math.floor((inteiro % 1000000) / 1000);
    const unidades = inteiro % 1000;

    if (milhoes > 0) {
      const gMilhoes = converterGrupo(milhoes);
      partes.push(gMilhoes + (milhoes === 1 ? ' milhão' : ' milhões'));
    }

    if (milhares > 0) {
      if (milhares === 1 && options.usarHumMil) {
        partes.push('Hum mil');
      } else if (milhares === 1) {
        partes.push('um mil');
      } else {
        partes.push(converterGrupo(milhares) + ' mil');
      }
    }

    if (unidades > 0) {
      partes.push(converterGrupo(unidades));
    }

    // Junção com 'e' ou vírgulas
    let textoReais = '';
    if (partes.length === 1) {
      textoReais = partes[0];
    } else {
      // Ex: Hum mil e duzentos e cinquenta -> "Hum mil duzentos e cinquenta" conforme modelos
      // No modelo 3: "Hum mil duzentos e cinquenta reais"
      // No modelo 2: "Hum mil reais"
      // No modelo 1: "duzentos e cinquenta reais"
      textoReais = partes.join(' ');
    }

    textoReais += (inteiro === 1 ? ' real' : ' reais');
    partes.length = 0;
    partes.push(textoReais);
  }

  if (centavos > 0) {
    const textoCentavos = converterGrupo(centavos) + (centavos === 1 ? ' centavo' : ' centavos');
    if (inteiro > 0) {
      partes.push('e ' + textoCentavos);
    } else {
      partes.push(textoCentavos);
    }
  }

  let resultado = partes.join(' ');
  // Ajuste inicial de maiúscula se for Hum mil ou duzentos
  // No modelo 1: "duzentos e cinquenta reais"
  // No modelo 2: "Hum mil reais"
  // No modelo 3: "Hum mil duzentos e cinquenta reais"
  if (resultado.startsWith('hum mil')) {
    resultado = 'Hum mil' + resultado.substring(7);
  }

  return resultado;
}
