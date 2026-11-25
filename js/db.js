/**
 * Módulo de Banco de Dados Local (LocalStorage)
 * Gerencia Pacientes, Recibos e Configurações do Emitente.
 */

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

// Pacientes iniciais baseados nos 3 modelos reais fornecidos
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

// Recibos iniciais baseados nos modelos
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

export const DB = {
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

  // CONFIGURAÇÕES
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

  // PACIENTES
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
      // Atualizar
      const idx = list.findIndex(p => p.id === paciente.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...paciente };
      }
    } else {
      // Novo
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

  // RECIBOS
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

  // RELATÓRIOS
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
    
    // Agrupamento por mês
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

// Funções utilitárias
export function formatarCPF(cpf) {
  if (!cpf) return '';
  const digits = cpf.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
}

export function validarCPF(cpf) {
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

export function formatarMoeda(valor) {
  const num = parseFloat(valor) || 0;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
