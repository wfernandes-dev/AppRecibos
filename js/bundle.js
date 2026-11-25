/**
 * Bundle unificado do Recibos Luciana
 * Funciona tanto via protocolo HTTP (PWA com Service Worker)
 * quanto abrindo diretamente pelo arquivo local (file://) sem erro de CORS.
 */

// ==========================================
// 1. EXTENSO
// ==========================================
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

function numeroPorExtenso(valor, options = { usarHumMil: true }) {
  if (isNaN(valor) || valor === null) return '';
  
  const v = Math.round(valor * 100) / 100;
  const inteiro = Math.floor(v);
  const centavos = Math.round((v - inteiro) * 100);

  if (inteiro === 0 && centavos === 0) return 'zero reais';

  const partes = [];

  if (inteiro > 0) {
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

    let textoReais = '';
    if (partes.length === 1) {
      textoReais = partes[0];
    } else {
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
  if (resultado.startsWith('hum mil')) {
    resultado = 'Hum mil' + resultado.substring(7);
  }

  return resultado;
}

// ==========================================
// 2. BANCO DE DADOS LOCAL (DB)
// ==========================================
const STORAGE_KEYS = {
  PACIENTES: 'recibos_luciana_pacientes',
  RECIBOS: 'recibos_luciana_recibos',
  CONFIG: 'recibos_luciana_config'
};

const DEFAULT_CONFIG = {
  emitenteNome: 'Luciana Alonso Fernandes',
  emitenteRegistro: 'Fonoaudióloga CRFa 1-14891 1a Região',
  emitenteCpf: '056.045.466-07',
  cidade: 'Rio de Janeiro',
  servicoPadrao: 'serviços prestados de fonoaudiologia domiciliar ao paciente acima citado'
};

const INITIAL_PACIENTES = [
  {
    id: 'pac_1',
    nome: 'Sérgio Luís Coutinho Ferreira Lima',
    cpf: '375.575.057-00',
    telefone: '',
    criadoEm: '2026-10-01T10:00:00.000Z'
  },
  {
    id: 'pac_2',
    nome: 'Cláudio Ribeiro Rodrigues Alves',
    cpf: '006.412.667-66',
    telefone: '',
    criadoEm: '2026-10-01T10:00:00.000Z'
  },
  {
    id: 'pac_3',
    nome: 'José Deni Paim Fortes',
    cpf: '059.892.477-96',
    telefone: '',
    criadoEm: '2026-09-01T10:00:00.000Z'
  }
];

const INITIAL_RECIBOS = [
  {
    id: 'rec_1',
    numeroRecibo: 'REC-2026-001',
    pacienteId: 'pac_1',
    pacienteNome: 'Sérgio Luís Coutinho Ferreira Lima',
    pacienteCpf: '375.575.057-00',
    valor: 250.00,
    qtdSessoes: 1,
    mesReferencia: 'Outubro',
    anoReferencia: 2026,
    tipoPeriodo: 'dia_especifico',
    dataEspecifica: '24 de Outubro de 2026',
    servicoDescricao: 'serviços prestados de fonoaudiologia domiciliar ao paciente acima citado',
    dataEmissao: '2026-11-09',
    cidadeEmissao: 'Rio de Janeiro',
    criadoEm: '2026-11-09T14:00:00.000Z'
  },
  {
    id: 'rec_2',
    numeroRecibo: 'REC-2026-002',
    pacienteId: 'pac_2',
    pacienteNome: 'Cláudio Ribeiro Rodrigues Alves',
    pacienteCpf: '006.412.667-66',
    valor: 1000.00,
    qtdSessoes: 4,
    mesReferencia: 'Outubro',
    anoReferencia: 2026,
    tipoPeriodo: 'mes_completo',
    dataEspecifica: '',
    servicoDescricao: 'serviços prestados de fonoaudiologia domiciliar',
    dataEmissao: '2026-11-09',
    cidadeEmissao: 'Rio de Janeiro',
    criadoEm: '2026-11-09T14:30:00.000Z'
  },
  {
    id: 'rec_3',
    numeroRecibo: 'REC-2026-003',
    pacienteId: 'pac_3',
    pacienteNome: 'José Deni Paim Fortes',
    pacienteCpf: '059.892.477-96',
    valor: 1250.00,
    qtdSessoes: 5,
    mesReferencia: 'Setembro',
    anoReferencia: 2026,
    tipoPeriodo: 'mes_completo',
    dataEspecifica: '',
    servicoDescricao: 'serviços prestados de fonoaudiologia domiciliar ao paciente acima citado',
    dataEmissao: '2026-09-30',
    cidadeEmissao: 'Rio de Janeiro',
    criadoEm: '2026-09-30T17:00:00.000Z'
  }
];

const DB = {
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.CONFIG)) {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(DEFAULT_CONFIG));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PACIENTES)) {
      localStorage.setItem(STORAGE_KEYS.PACIENTES, JSON.stringify(INITIAL_PACIENTES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.RECIBOS)) {
      localStorage.setItem(STORAGE_KEYS.RECIBOS, JSON.stringify(INITIAL_RECIBOS));
    }
  },

  getConfig() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.CONFIG)) || DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  },

  salvarConfig(config) {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify({ ...DEFAULT_CONFIG, ...config }));
  },

  getPacientes() {
    this.init();
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.PACIENTES)) || [];
      return data.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    } catch {
      return [];
    }
  },

  getPacientePorId(id) {
    const list = this.getPacientes();
    return list.find(p => p.id === id) || null;
  },

  salvarPaciente(paciente) {
    const list = this.getPacientes();
    if (paciente.id) {
      const idx = list.findIndex(p => p.id === paciente.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...paciente };
      }
    } else {
      const novo = {
        ...paciente,
        id: 'pac_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        criadoEm: new Date().toISOString()
      };
      list.push(novo);
    }
    localStorage.setItem(STORAGE_KEYS.PACIENTES, JSON.stringify(list));
    return paciente.id || list[list.length - 1].id;
  },

  removerPaciente(id) {
    const list = this.getPacientes().filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PACIENTES, JSON.stringify(list));
  },

  getRecibos() {
    this.init();
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECIBOS)) || [];
      return data.sort((a, b) => new Date(b.dataEmissao) - new Date(a.dataEmissao));
    } catch {
      return [];
    }
  },

  getReciboPorId(id) {
    const list = this.getRecibos();
    return list.find(r => r.id === id) || null;
  },

  salvarRecibo(recibo) {
    const list = this.getRecibos();
    if (recibo.id) {
      const idx = list.findIndex(r => r.id === recibo.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...recibo };
      }
    } else {
      const novo = {
        ...recibo,
        id: 'rec_' + Date.now(),
        numeroRecibo: 'REC-' + new Date().getFullYear() + '-' + String(list.length + 1).padStart(3, '0'),
        criadoEm: new Date().toISOString()
      };
      list.unshift(novo);
    }
    localStorage.setItem(STORAGE_KEYS.RECIBOS, JSON.stringify(list));
    return recibo.id || list[0].id;
  },

  removerRecibo(id) {
    const list = this.getRecibos().filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.RECIBOS, JSON.stringify(list));
  },

  getRelatorioPorPaciente(pacienteId, ano = null) {
    const recibos = this.getRecibos().filter(r => r.pacienteId === pacienteId);
    const filtrados = ano ? recibos.filter(r => new Date(r.dataEmissao).getFullYear() === parseInt(ano, 10)) : recibos;

    const totalValor = filtrados.reduce((acc, r) => acc + (parseFloat(r.valor) || 0), 0);
    const totalSessoes = filtrados.reduce((acc, r) => acc + (parseInt(r.qtdSessoes, 10) || 0), 0);

    return {
      paciente: this.getPacientePorId(pacienteId),
      recibos: filtrados,
      totalValor,
      totalSessoes,
      ano: ano || 'Todos os anos'
    };
  },

  getRelatorioGeral(ano = new Date().getFullYear()) {
    const recibos = this.getRecibos().filter(r => new Date(r.dataEmissao).getFullYear() === parseInt(ano, 10));
    
    const meses = {};
    for (let m = 1; m <= 12; m++) {
      meses[m] = { total: 0, sessoes: 0, count: 0 };
    }

    recibos.forEach(r => {
      const data = new Date(r.dataEmissao);
      const m = data.getMonth() + 1;
      if (meses[m]) {
        meses[m].total += parseFloat(r.valor) || 0;
        meses[m].sessoes += parseInt(r.qtdSessoes, 10) || 0;
        meses[m].count += 1;
      }
    });

    const totalGeral = recibos.reduce((acc, r) => acc + (parseFloat(r.valor) || 0), 0);
    const sessoesGeral = recibos.reduce((acc, r) => acc + (parseInt(r.qtdSessoes, 10) || 0), 0);

    return {
      ano,
      meses,
      totalGeral,
      sessoesGeral,
      totalRecibos: recibos.length,
      recibos
    };
  }
};

function formatarCPF(cpf) {
  if (!cpf) return '';
  const digits = cpf.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
}

function validarCPF(cpf) {
  if (!cpf) return false;
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(digits.charAt(i), 10) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(digits.charAt(9), 10)) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(digits.charAt(i), 10) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(digits.charAt(10), 10)) return false;

  return true;
}

// ==========================================
// 3. MOTOR DE GERAÇÃO PDF
// ==========================================
const MESES_PT = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
];

function formatarDataPorExtenso(dataStr, cidade = 'Rio de Janeiro') {
  if (!dataStr) return `${cidade}, ${new Date().getDate()} de ${MESES_PT[new Date().getMonth()]} de ${new Date().getFullYear()}`;
  
  const [ano, mes, dia] = dataStr.split('-');
  const mesIndex = parseInt(mes, 10) - 1;
  const mesNome = MESES_PT[mesIndex] || mes;
  return `${cidade}, ${parseInt(dia, 10)} de ${mesNome} de ${ano}`;
}

function formatarValorBRL(valor) {
  const num = parseFloat(valor) || 0;
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function construirTextoRecibo(recibo, config) {
  const valorNum = parseFloat(recibo.valor) || 0;
  const extenso = numeroPorExtenso(valorNum, { usarHumMil: true });
  const sessoesNum = parseInt(recibo.qtdSessoes, 10) || 1;
  const termo = sessoesNum === 1 ? 'sessão' : 'sessões';
  
  let textoPeriodo = '';
  if (recibo.tipoPeriodo === 'dia_especifico' && recibo.dataEspecifica) {
    textoPeriodo = `realizados no dia ${recibo.dataEspecifica}`;
  } else {
    const mes = (recibo.mesReferencia || '').toLowerCase();
    const ano = recibo.anoReferencia || new Date().getFullYear();
    textoPeriodo = `realizados durante o mês de ${mes} de ${ano}`;
  }

  const servico = recibo.servicoDescricao || config.servicoPadrao;

  return `Recebi de ${recibo.pacienteNome}, CPF ${recibo.pacienteCpf}, a quantia de ${extenso} relativos a ( ${sessoesNum} ) ${termo} de ${servico}, ${textoPeriodo}.`;
}

function criarDocumentoPDF(recibo, config) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const centerX = pageWidth / 2;

  // 1. CABEÇALHO (Nome manuscrito / elegante e Conselho)
  doc.setFont('times', 'italic');
  doc.setFontSize(22);
  doc.setTextColor(30, 30, 30);
  doc.text(config.emitenteNome || 'Luciana Alonso Fernandes', centerX, 35, { align: 'center' });

  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  const infoProfissional = `${config.emitenteRegistro} CPF ${config.emitenteCpf}`;
  doc.text(infoProfissional, centerX, 44, { align: 'center' });

  // 2. TÍTULO DO RECIBO
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  const tituloRecibo = `RECIBO R$ ${formatarValorBRL(recibo.valor)}`;
  doc.text(tituloRecibo, centerX, 75, { align: 'center' });

  // 3. CORPO DO RECIBO (Justificado)
  doc.setFont('times', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(20, 20, 20);

  const textoCorpo = construirTextoRecibo(recibo, config);
  const marginX = 28;
  const larguraTexto = pageWidth - (marginX * 2);
  const linhas = doc.splitTextToSize(textoCorpo, larguraTexto);

  doc.text(linhas, marginX, 90, {
    maxWidth: larguraTexto,
    align: 'justify',
    lineHeightFactor: 1.45
  });

  // 4. DATA E LOCAL
  const dataExtenso = formatarDataPorExtenso(recibo.dataEmissao, config.cidade);
  doc.setFont('times', 'normal');
  doc.setFontSize(12);
  doc.text(dataExtenso, centerX, 135, { align: 'center' });

  // 5. LINHA DE ASSINATURA E NOME
  const linhaY = 158;
  const linhaLargura = 110;
  const xInicioLinha = centerX - (linhaLargura / 2);
  const xFimLinha = centerX + (linhaLargura / 2);

  doc.setLineWidth(0.3);
  doc.setDrawColor(50, 50, 50);
  doc.line(xInicioLinha, linhaY, xFimLinha, linhaY);

  doc.setFont('times', 'normal');
  doc.setFontSize(12);
  doc.text(config.emitenteNome || 'Luciana Alonso Fernandes', centerX, linhaY + 7, { align: 'center' });

  return doc;
}

function gerarNomeArquivo(recibo) {
  const nomeLimpo = (recibo.pacienteNome || 'Paciente')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '_');
  const mes = (recibo.mesReferencia || 'Recibo').toLowerCase();
  const ano = recibo.anoReferencia || new Date().getFullYear();
  return `Recibo_${nomeLimpo}_${mes}_${ano}.pdf`;
}

function abrirReciboPDF(recibo, config) {
  const doc = criarDocumentoPDF(recibo, config);
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}

function baixarReciboPDF(recibo, config) {
  const doc = criarDocumentoPDF(recibo, config);
  const nomeArquivo = gerarNomeArquivo(recibo);
  doc.save(nomeArquivo);
}

async function compartilharReciboWhatsApp(recibo, config) {
  const doc = criarDocumentoPDF(recibo, config);
  const blob = doc.output('blob');
  const nomeArquivo = gerarNomeArquivo(recibo);
  const file = new File([blob], nomeArquivo, { type: 'application/pdf' });

  const textoMensagem = `Olá, ${recibo.pacienteNome}! Segue o seu recibo referente às sessões de fonoaudiologia de ${recibo.mesReferencia}/${recibo.anoReferencia}. Atenciosamente, ${config.emitenteNome}.`;

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: `Recibo - ${recibo.pacienteNome}`,
        text: textoMensagem
      });
      return true;
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('Erro no compartilhamento nativo:', err);
      }
    }
  }

  doc.save(nomeArquivo);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(textoMensagem)}`;
  window.open(whatsappUrl, '_blank');
  return false;
}

function criarRelatorioPDF(dadosRelatorio, config) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const centerX = pageWidth / 2;

  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.text('DECLARAÇÃO DE PAGAMENTOS DE SERVIÇOS', centerX, 25, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`Para fins de Comprovação e Imposto de Renda (IRPF) - Exercício ${dadosRelatorio.ano}`, centerX, 32, { align: 'center' });

  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.text(`Profissional: ${config.emitenteNome} | ${config.emitenteRegistro} | CPF: ${config.emitenteCpf}`, centerX, 40, { align: 'center' });

  doc.setLineWidth(0.3);
  doc.line(20, 44, pageWidth - 20, 44);

  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.text('DADOS DO PACIENTE:', 20, 52);
  doc.setFont('times', 'normal');
  doc.text(`Nome: ${dadosRelatorio.paciente.nome}`, 20, 58);
  doc.text(`CPF: ${dadosRelatorio.paciente.cpf}`, 20, 64);

  doc.setFont('times', 'bold');
  doc.text('HISTÓRICO DE RECIBOS EMITIDOS NO PERÍODO:', 20, 75);

  let startY = 82;
  doc.setFillColor(245, 245, 245);
  doc.rect(20, startY - 5, pageWidth - 40, 7, 'F');
  doc.setFontSize(10);
  doc.text('Recibo', 23, startY);
  doc.text('Data Emissão', 55, startY);
  doc.text('Mês Ref.', 90, startY);
  doc.text('Sessões', 125, startY);
  doc.text('Valor (R$)', 160, startY);

  startY += 6;
  doc.setFont('times', 'normal');

  dadosRelatorio.recibos.forEach((r, idx) => {
    if (startY > 260) {
      doc.addPage();
      startY = 25;
    }
    const dataFmt = r.dataEmissao.split('-').reverse().join('/');
    doc.text(r.numeroRecibo || `REC-${idx + 1}`, 23, startY);
    doc.text(dataFmt, 55, startY);
    doc.text(`${r.mesReferencia}/${r.anoReferencia}`, 90, startY);
    doc.text(String(r.qtdSessoes), 130, startY);
    doc.text(formatarValorBRL(r.valor), 160, startY);

    doc.setDrawColor(230, 230, 230);
    doc.line(20, startY + 2, pageWidth - 20, startY + 2);
    startY += 7;
  });

  startY += 5;
  doc.setFillColor(240, 247, 255);
  doc.rect(20, startY - 5, pageWidth - 40, 10, 'F');
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.text('TOTAL DE SESSÕES: ' + dadosRelatorio.totalSessoes, 25, startY + 1);
  doc.text('VALOR TOTAL PAGO: R$ ' + formatarValorBRL(dadosRelatorio.totalValor), 125, startY + 1);

  const dataHojeExtenso = formatarDataPorExtenso(new Date().toISOString().split('T')[0], config.cidade);
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.text(dataHojeExtenso, centerX, startY + 28, { align: 'center' });

  doc.line(centerX - 50, startY + 45, centerX + 50, startY + 45);
  doc.text(config.emitenteNome, centerX, startY + 51, { align: 'center' });

  return doc;
}

// ==========================================
// 4. CONTROLADOR DA INTERFACE E EVENTOS
// ==========================================
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

let pacienteSelecionadoId = null;
let reciboRecenteGerado = null;

function showToast(mensagem) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = mensagem;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function registrarServiceWorker() {
  if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('./service-worker.js')
      .then(() => console.log('Service Worker registrado.'))
      .catch(err => console.log('SW erro:', err));
  }
}

function inicializarNavegacao() {
  const navItems = document.querySelectorAll('.nav-item');
  const views = document.querySelectorAll('.tab-view');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetTab = item.dataset.tab;
      
      navItems.forEach(i => i.classList.remove('active'));
      views.forEach(v => v.classList.remove('active'));

      item.classList.add('active');
      const targetView = document.getElementById(targetTab);
      if (targetView) targetView.classList.add('active');

      if (targetTab === 'pacientes-view') renderizarListaPacientes();
      if (targetTab === 'historico-view') renderizarHistorico();
      if (targetTab === 'relatorios-view') atualizarOpcoesRelatorio();
      if (targetTab === 'config-view') carregarConfiguracoesNaTela();
    });
  });
}

function inicializarFormularioRecibo() {
  const selectPaciente = document.getElementById('recibo-paciente');
  const inputValor = document.getElementById('recibo-valor');
  const inputExtenso = document.getElementById('recibo-extenso-preview');
  const inputSessoes = document.getElementById('recibo-sessoes');
  const selectMes = document.getElementById('recibo-mes');
  const inputAno = document.getElementById('recibo-ano');
  const selectTipoPeriodo = document.getElementById('recibo-tipo-periodo');
  const boxDataEspecifica = document.getElementById('box-data-especifica');
  const inputDataEspecifica = document.getElementById('recibo-data-especifica');
  const inputDataEmissao = document.getElementById('recibo-data-emissao');

  selectMes.innerHTML = MESES.map((m, idx) => {
    const isCurrent = idx === new Date().getMonth();
    return `<option value="${m}" ${isCurrent ? 'selected' : ''}>${m}</option>`;
  }).join('');

  inputAno.value = new Date().getFullYear();
  inputDataEmissao.value = new Date().toISOString().split('T')[0];

  selectTipoPeriodo.addEventListener('change', () => {
    if (selectTipoPeriodo.value === 'dia_especifico') {
      boxDataEspecifica.style.display = 'block';
    } else {
      boxDataEspecifica.style.display = 'none';
    }
    atualizarPreviewRecibo();
  });

  inputValor.addEventListener('input', () => {
    const valor = parseFloat(inputValor.value) || 0;
    const extenso = numeroPorExtenso(valor, { usarHumMil: true });
    inputExtenso.textContent = extenso ? `(${extenso})` : '';
    atualizarPreviewRecibo();
  });

  inputSessoes.addEventListener('input', atualizarPreviewRecibo);
  selectMes.addEventListener('change', atualizarPreviewRecibo);
  inputAno.addEventListener('input', atualizarPreviewRecibo);
  inputDataEspecifica.addEventListener('input', atualizarPreviewRecibo);
  inputDataEmissao.addEventListener('input', atualizarPreviewRecibo);
  selectPaciente.addEventListener('change', () => {
    pacienteSelecionadoId = selectPaciente.value;
    atualizarPreviewRecibo();
  });

  atualizarSelectPacientes();

  document.getElementById('btn-gerar-recibo').addEventListener('click', salvarEEmitirRecibo);
  document.getElementById('btn-preview-pdf').addEventListener('click', () => {
    const r = coletarDadosFormularioRecibo();
    if (r) abrirReciboPDF(r, DB.getConfig());
  });
  document.getElementById('btn-share-wpp').addEventListener('click', () => {
    const r = coletarDadosFormularioRecibo();
    if (r) compartilharReciboWhatsApp(r, DB.getConfig());
  });
}

function atualizarSelectPacientes() {
  const select = document.getElementById('recibo-paciente');
  const pacientes = DB.getPacientes();
  
  if (pacientes.length === 0) {
    select.innerHTML = '<option value="">Nenhum paciente cadastrado</option>';
    return;
  }

  select.innerHTML = '<option value="">-- Selecione o Paciente --</option>' +
    pacientes.map(p => `<option value="${p.id}">${p.nome} (CPF: ${p.cpf})</option>`).join('');

  if (pacienteSelecionadoId) {
    select.value = pacienteSelecionadoId;
  }
}

function coletarDadosFormularioRecibo() {
  const pacienteId = document.getElementById('recibo-paciente').value;
  if (!pacienteId) {
    showToast('Selecione um paciente!');
    return null;
  }

  const paciente = DB.getPacientePorId(pacienteId);
  const valor = parseFloat(document.getElementById('recibo-valor').value) || 0;
  if (valor <= 0) {
    showToast('Informe o valor das sessões!');
    return null;
  }

  const sessoes = parseInt(document.getElementById('recibo-sessoes').value, 10) || 1;
  const mes = document.getElementById('recibo-mes').value;
  const ano = parseInt(document.getElementById('recibo-ano').value, 10) || new Date().getFullYear();
  const tipoPeriodo = document.getElementById('recibo-tipo-periodo').value;
  const dataEspecifica = document.getElementById('recibo-data-especifica').value.trim();
  const dataEmissao = document.getElementById('recibo-data-emissao').value;
  const config = DB.getConfig();

  return {
    pacienteId: paciente.id,
    pacienteNome: paciente.nome,
    pacienteCpf: paciente.cpf,
    valor,
    qtdSessoes: sessoes,
    mesReferencia: mes,
    anoReferencia: ano,
    tipoPeriodo,
    dataEspecifica,
    dataEmissao,
    cidadeEmissao: config.cidade,
    servicoDescricao: config.servicoPadrao
  };
}

function salvarEEmitirRecibo() {
  const dados = coletarDadosFormularioRecibo();
  if (!dados) return;

  const id = DB.salvarRecibo(dados);
  dados.id = id;
  reciboRecenteGerado = dados;

  showToast('Recibo gerado e salvo com sucesso!');
  document.getElementById('pos-emissao-box').style.display = 'block';
  document.getElementById('pos-emissao-box').scrollIntoView({ behavior: 'smooth' });
}

function atualizarPreviewRecibo() {
  const pBox = document.getElementById('live-preview-box');
  const pacienteId = document.getElementById('recibo-paciente').value;
  const paciente = DB.getPacientePorId(pacienteId);
  const config = DB.getConfig();

  const valor = parseFloat(document.getElementById('recibo-valor').value) || 0;
  const sessoes = parseInt(document.getElementById('recibo-sessoes').value, 10) || 1;
  const mes = document.getElementById('recibo-mes').value;
  const ano = document.getElementById('recibo-ano').value;
  const tipoPeriodo = document.getElementById('recibo-tipo-periodo').value;
  const dataEspecifica = document.getElementById('recibo-data-especifica').value;
  const dataEmissao = document.getElementById('recibo-data-emissao').value;

  const mockRecibo = {
    pacienteNome: paciente ? paciente.nome : '[Nome do Paciente]',
    pacienteCpf: paciente ? paciente.cpf : '[CPF]',
    valor,
    qtdSessoes: sessoes,
    mesReferencia: mes,
    anoReferencia: ano,
    tipoPeriodo,
    dataEspecifica,
    servicoDescricao: config.servicoPadrao
  };

  const texto = construirTextoRecibo(mockRecibo, config);
  const dataFmt = formatarDataPorExtenso(dataEmissao, config.cidade);

  pBox.innerHTML = `
    <div class="preview-box-header">
      <div class="p-name">${config.emitenteNome}</div>
      <div class="p-desc">${config.emitenteRegistro} CPF ${config.emitenteCpf}</div>
    </div>
    <div class="preview-box-title">RECIBO R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
    <p style="text-align: justify; margin: 10px 0;">${texto}</p>
    <div class="preview-box-date">${dataFmt}</div>
    <div style="text-align: center; margin-top: 15px;">
      <div style="display:inline-block; width: 60%; border-top: 1px solid #777; margin-bottom: 3px;"></div>
      <div style="font-size: 0.85rem;">${config.emitenteNome}</div>
    </div>
  `;
}

function inicializarPacientes() {
  const modal = document.getElementById('modal-paciente');
  const btnNovo = document.getElementById('btn-novo-paciente');
  const btnFechar = document.getElementById('btn-fechar-modal-paciente');
  const btnSalvar = document.getElementById('btn-salvar-paciente');
  const inputCpf = document.getElementById('paciente-cpf');
  const inputBusca = document.getElementById('busca-paciente');

  inputCpf.addEventListener('input', (e) => {
    e.target.value = formatarCPF(e.target.value);
  });

  btnNovo.addEventListener('click', () => {
    document.getElementById('paciente-id').value = '';
    document.getElementById('paciente-nome').value = '';
    document.getElementById('paciente-cpf').value = '';
    document.getElementById('modal-paciente-titulo').textContent = 'Novo Paciente';
    modal.classList.add('active');
  });

  btnFechar.addEventListener('click', () => modal.classList.remove('active'));

  btnSalvar.addEventListener('click', () => {
    const id = document.getElementById('paciente-id').value;
    const nome = document.getElementById('paciente-nome').value.trim();
    const cpf = document.getElementById('paciente-cpf').value.trim();

    if (!nome) {
      showToast('Preencha o nome do paciente!');
      return;
    }

    if (!validarCPF(cpf)) {
      showToast('CPF inválido! Verifique os números digitados.');
      return;
    }

    DB.salvarPaciente({ id: id || undefined, nome, cpf });
    modal.classList.remove('active');
    showToast('Paciente salvo com sucesso!');
    renderizarListaPacientes();
    atualizarSelectPacientes();
  });

  inputBusca.addEventListener('input', renderizarListaPacientes);
  renderizarListaPacientes();
}

function renderizarListaPacientes() {
  const container = document.getElementById('lista-pacientes');
  const termo = (document.getElementById('busca-paciente')?.value || '').toLowerCase();
  const pacientes = DB.getPacientes();

  const filtrados = pacientes.filter(p => 
    p.nome.toLowerCase().includes(termo) || p.cpf.includes(termo)
  );

  if (filtrados.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding: 30px;">
        Nenhum paciente encontrado.
      </div>
    `;
    return;
  }

  container.innerHTML = filtrados.map(p => `
    <div class="list-item">
      <div class="list-item-content">
        <h3>${p.nome}</h3>
        <p>CPF: ${p.cpf}</p>
      </div>
      <div class="list-item-actions">
        <button class="action-btn" onclick="window.emitirParaPaciente('${p.id}')" title="Emitir Recibo">
          🧾 Emitir
        </button>
        <button class="action-btn" onclick="window.editarPaciente('${p.id}')" title="Editar">
          ✏️
        </button>
        <button class="action-btn btn-danger-outline" onclick="window.excluirPaciente('${p.id}')" title="Excluir">
          🗑️
        </button>
      </div>
    </div>
  `).join('');
}

window.emitirParaPaciente = function(pacienteId) {
  pacienteSelecionadoId = pacienteId;
  atualizarSelectPacientes();
  document.getElementById('recibo-paciente').value = pacienteId;
  atualizarPreviewRecibo();
  document.querySelector('.nav-item[data-tab="emitir-view"]').click();
};

window.editarPaciente = function(pacienteId) {
  const p = DB.getPacientePorId(pacienteId);
  if (!p) return;
  document.getElementById('paciente-id').value = p.id;
  document.getElementById('paciente-nome').value = p.nome;
  document.getElementById('paciente-cpf').value = p.cpf;
  document.getElementById('modal-paciente-titulo').textContent = 'Editar Paciente';
  document.getElementById('modal-paciente').classList.add('active');
};

window.excluirPaciente = function(pacienteId) {
  if (confirm('Deseja realmente excluir este paciente? Os recibos anteriores continuarão salvos.')) {
    DB.removerPaciente(pacienteId);
    showToast('Paciente removido.');
    renderizarListaPacientes();
    atualizarSelectPacientes();
  }
};

function inicializarHistorico() {
  document.getElementById('busca-historico').addEventListener('input', renderizarHistorico);
  renderizarHistorico();
}

function renderizarHistorico() {
  const container = document.getElementById('lista-historico');
  const termo = (document.getElementById('busca-historico')?.value || '').toLowerCase();
  const recibos = DB.getRecibos();

  const filtrados = recibos.filter(r => 
    r.pacienteNome.toLowerCase().includes(termo) || 
    r.pacienteCpf.includes(termo) ||
    r.mesReferencia.toLowerCase().includes(termo)
  );

  if (filtrados.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding: 30px;">
        Nenhum recibo emitido ainda.
      </div>
    `;
    return;
  }

  container.innerHTML = filtrados.map(r => `
    <div class="list-item">
      <div class="list-item-content">
        <h3>${r.pacienteNome}</h3>
        <p><strong>R$ ${parseFloat(r.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> • ${r.qtdSessoes} ${r.qtdSessoes === 1 ? 'sessão' : 'sessões'} • Ref: ${r.mesReferencia}/${r.anoReferencia}</p>
        <p style="font-size: 0.75rem;">Emitido em: ${r.dataEmissao.split('-').reverse().join('/')}</p>
      </div>
      <div class="list-item-actions">
        <button class="action-btn" onclick="window.baixarReciboHistorico('${r.id}')" title="Baixar PDF">
          📄 PDF
        </button>
        <button class="action-btn btn-wpp" onclick="window.compartilharReciboHistorico('${r.id}')" title="WhatsApp">
          💬
        </button>
        <button class="action-btn btn-danger-outline" onclick="window.excluirRecibo('${r.id}')" title="Excluir">
          🗑️
        </button>
      </div>
    </div>
  `).join('');
}

window.baixarReciboHistorico = function(id) {
  const r = DB.getReciboPorId(id);
  if (r) baixarReciboPDF(r, DB.getConfig());
};

window.compartilharReciboHistorico = function(id) {
  const r = DB.getReciboPorId(id);
  if (r) compartilharReciboWhatsApp(r, DB.getConfig());
};

window.excluirRecibo = function(id) {
  if (confirm('Deseja excluir este recibo do histórico?')) {
    DB.removerRecibo(id);
    showToast('Recibo removido do histórico.');
    renderizarHistorico();
  }
};

function inicializarRelatorios() {
  const selectPaciente = document.getElementById('relatorio-paciente');
  const selectAno = document.getElementById('relatorio-ano');
  const btnGerarPdf = document.getElementById('btn-relatorio-pdf');

  atualizarOpcoesRelatorio();

  selectPaciente.addEventListener('change', renderizarRelatorioNaTela);
  selectAno.addEventListener('change', renderizarRelatorioNaTela);

  btnGerarPdf.addEventListener('click', () => {
    const pacienteId = selectPaciente.value;
    const ano = selectAno.value;
    if (!pacienteId) {
      showToast('Selecione um paciente para o relatório anual!');
      return;
    }
    const relatorio = DB.getRelatorioPorPaciente(pacienteId, ano ? parseInt(ano, 10) : null);
    if (!relatorio.recibos.length) {
      showToast('Nenhum recibo para o paciente no ano selecionado.');
      return;
    }
    const doc = criarRelatorioPDF(relatorio, DB.getConfig());
    doc.save(`Declaracao_IRPF_${relatorio.paciente.nome.replace(/\s+/g, '_')}_${ano}.pdf`);
  });
}

function atualizarOpcoesRelatorio() {
  const selectPaciente = document.getElementById('relatorio-paciente');
  const selectAno = document.getElementById('relatorio-ano');
  const pacientes = DB.getPacientes();

  selectPaciente.innerHTML = '<option value="">-- Todos os Pacientes --</option>' +
    pacientes.map(p => `<option value="${p.id}">${p.nome}</option>`).join('');

  const currentYear = new Date().getFullYear();
  selectAno.innerHTML = `
    <option value="${currentYear}">${currentYear}</option>
    <option value="${currentYear - 1}">${currentYear - 1}</option>
    <option value="">Todos os anos</option>
  `;

  renderizarRelatorioNaTela();
}

function renderizarRelatorioNaTela() {
  const pacienteId = document.getElementById('relatorio-paciente').value;
  const ano = document.getElementById('relatorio-ano').value;
  const container = document.getElementById('resultado-relatorio');

  if (pacienteId) {
    const relatorio = DB.getRelatorioPorPaciente(pacienteId, ano ? parseInt(ano, 10) : null);
    document.getElementById('btn-relatorio-pdf').style.display = 'inline-flex';

    container.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">R$ ${relatorio.totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          <div class="stat-label">Total Pago no Período</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${relatorio.totalSessoes}</div>
          <div class="stat-label">Total de Sessões</div>
        </div>
      </div>
      <div class="card" style="padding: 12px;">
        <h4 style="font-size: 0.9rem; margin-bottom: 8px;">Recibos Emitidos (${relatorio.recibos.length})</h4>
        ${relatorio.recibos.map(r => `
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; padding: 6px 0; border-bottom: 1px solid var(--border);">
            <span>${r.mesReferencia}/${r.anoReferencia} (${r.qtdSessoes} sessões)</span>
            <strong>R$ ${parseFloat(r.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
          </div>
        `).join('')}
      </div>
    `;
  } else {
    document.getElementById('btn-relatorio-pdf').style.display = 'none';
    const relatorioGeral = DB.getRelatorioGeral(ano ? parseInt(ano, 10) : new Date().getFullYear());

    container.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">R$ ${relatorioGeral.totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          <div class="stat-label">Faturamento Total (${relatorioGeral.ano})</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${relatorioGeral.sessoesGeral}</div>
          <div class="stat-label">Total de Sessões no Ano</div>
        </div>
      </div>
      <div class="card" style="padding: 12px;">
        <h4 style="font-size: 0.9rem; margin-bottom: 8px;">Faturamento Mensal em ${relatorioGeral.ano}</h4>
        ${MESES.map((nomeMes, idx) => {
          const dadosMes = relatorioGeral.meses[idx + 1];
          if (!dadosMes || dadosMes.total === 0) return '';
          return `
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; padding: 6px 0; border-bottom: 1px solid var(--border);">
              <span>${nomeMes} (${dadosMes.sessoes} sessões)</span>
              <strong>R$ ${dadosMes.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
}

function inicializarConfiguracoes() {
  document.getElementById('btn-salvar-config').addEventListener('click', () => {
    const config = {
      emitenteNome: document.getElementById('cfg-nome').value.trim(),
      emitenteRegistro: document.getElementById('cfg-registro').value.trim(),
      emitenteCpf: document.getElementById('cfg-cpf').value.trim(),
      cidade: document.getElementById('cfg-cidade').value.trim(),
      servicoPadrao: document.getElementById('cfg-servico').value.trim()
    };
    DB.salvarConfig(config);
    showToast('Configurações salvas!');
    atualizarPreviewRecibo();
  });
}

function carregarConfiguracoesNaTela() {
  const config = DB.getConfig();
  document.getElementById('cfg-nome').value = config.emitenteNome;
  document.getElementById('cfg-registro').value = config.emitenteRegistro;
  document.getElementById('cfg-cpf').value = config.emitenteCpf;
  document.getElementById('cfg-cidade').value = config.cidade;
  document.getElementById('cfg-servico').value = config.servicoPadrao;
}

// Inicialização DOM
document.addEventListener('DOMContentLoaded', () => {
  DB.init();
  inicializarNavegacao();
  inicializarFormularioRecibo();
  inicializarPacientes();
  inicializarHistorico();
  inicializarRelatorios();
  inicializarConfiguracoes();
  registrarServiceWorker();

  document.getElementById('btn-pos-pdf').addEventListener('click', () => {
    if (reciboRecenteGerado) abrirReciboPDF(reciboRecenteGerado, DB.getConfig());
  });

  document.getElementById('btn-pos-wpp').addEventListener('click', () => {
    if (reciboRecenteGerado) compartilharReciboWhatsApp(reciboRecenteGerado, DB.getConfig());
  });
});
