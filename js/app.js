import { DB, formatarCPF, validarCPF, formatarMoeda } from './db.js';
import { numeroPorExtenso } from './extenso.js';
import {
  abrirReciboPDF,
  baixarReciboPDF,
  compartilharReciboWhatsApp,
  construirTextoRecibo,
  criarRelatorioPDF,
  formatarDataPorExtenso
} from './pdf-generator.js';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

let pacienteSelecionadoId = null;
let reciboRecenteGerado = null;

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', () => {
  DB.init();
  inicializarNavegacao();
  inicializarFormularioRecibo();
  inicializarPacientes();
  inicializarHistorico();
  inicializarRelatorios();
  inicializarConfiguracoes();
  registrarServiceWorker();
});

// Toast notification
function showToast(mensagem) {
  const toast = document.getElementById('toast');
  toast.textContent = mensagem;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// Service worker para PWA offline
function registrarServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js')
      .then(() => console.log('PWA Service Worker registrado com sucesso.'))
      .catch(err => console.log('Falha ao registrar Service Worker:', err));
  }
}

// Navegação entre abas
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

      // Atualiza listas quando entra na aba
      if (targetTab === 'pacientes-view') renderizarListaPacientes();
      if (targetTab === 'historico-view') renderizarHistorico();
      if (targetTab === 'relatorios-view') atualizarOpcoesRelatorio();
      if (targetTab === 'config-view') carregarConfiguracoesNaTela();
    });
  });
}

// ----------------------------------------------------
// ABA: EMISSÃO DE RECIBOS
// ----------------------------------------------------
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

  // Preenche meses
  selectMes.innerHTML = MESES.map((m, idx) => {
    const isCurrent = idx === new Date().getMonth();
    return `<option value="${m}" ${isCurrent ? 'selected' : ''}>${m}</option>`;
  }).join('');

  inputAno.value = new Date().getFullYear();
  inputDataEmissao.value = new Date().toISOString().split('T')[0];

  // Alternância de tipo de período
  selectTipoPeriodo.addEventListener('change', () => {
    if (selectTipoPeriodo.value === 'dia_especifico') {
      boxDataEspecifica.style.display = 'block';
    } else {
      boxDataEspecifica.style.display = 'none';
    }
    atualizarPreviewRecibo();
  });

  // Atualização do extenso em tempo real
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

  // Atualiza opções de pacientes
  atualizarSelectPacientes();

  // Ações de emissão
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

  // Exibe ações pós-geração
  document.getElementById('pos-emissao-box').style.display = 'block';
  
  // Rola até o botão de download/compartilhamento
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

// ----------------------------------------------------
// ABA: PACIENTES
// ----------------------------------------------------
function inicializarPacientes() {
  const modal = document.getElementById('modal-paciente');
  const btnNovo = document.getElementById('btn-novo-paciente');
  const btnFechar = document.getElementById('btn-fechar-modal-paciente');
  const btnSalvar = document.getElementById('btn-salvar-paciente');
  const inputCpf = document.getElementById('paciente-cpf');
  const inputBusca = document.getElementById('busca-paciente');

  // Máscara automática de CPF
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

  // Navega para aba de emissão
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

// ----------------------------------------------------
// ABA: HISTÓRICO
// ----------------------------------------------------
function inicializarHistorico() {
  document.getElementById('busca-historico').addEventListener('input', renderizarHistorico);
  renderizarHistorico();
}

function renderizarHistorico() {
  const container = document.getElementById('lista-historico');
  const termo = (document.getElementById('busca-historico')?.value || '').toLowerCase();
  const recibos = DB.getRecibos();
  const config = DB.getConfig();

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

// ----------------------------------------------------
// ABA: RELATÓRIOS
// ----------------------------------------------------
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
    // Relatório do paciente selecionado
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
    // Relatório geral
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

// ----------------------------------------------------
// ABA: CONFIGURAÇÕES
// ----------------------------------------------------
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

// Botões pós emissão
document.getElementById('btn-pos-pdf').addEventListener('click', () => {
  if (reciboRecenteGerado) abrirReciboPDF(reciboRecenteGerado, DB.getConfig());
});

document.getElementById('btn-pos-wpp').addEventListener('click', () => {
  if (reciboRecenteGerado) compartilharReciboWhatsApp(reciboRecenteGerado, DB.getConfig());
});
