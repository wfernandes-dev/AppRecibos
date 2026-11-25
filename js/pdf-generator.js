/**
 * Gerador de PDF de Recibos e Relatórios
 * Reproduz fielmente a diagramação, tipografia e espaçamentos dos modelos originais da Luciana.
 */

import { numeroPorExtenso } from './extenso.js';

const MESES_PT = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
];

export function formatarDataPorExtenso(dataStr, cidade = 'Rio de Janeiro') {
  if (!dataStr) return `${cidade}, ${new Date().getDate()} de ${MESES_PT[new Date().getMonth()]} de ${new Date().getFullYear()}`;
  
  const [ano, mes, dia] = dataStr.split('-');
  const mesIndex = parseInt(mes, 10) - 1;
  const mesNome = MESES_PT[mesIndex] || mes;
  return `${cidade}, ${parseInt(dia, 10)} de ${mesNome} de ${ano}`;
}

export function formatarValorBRL(valor) {
  const num = parseFloat(valor) || 0;
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function construirTextoRecibo(recibo, config) {
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

/**
 * Gera o documento jsPDF exatamente no layout das amostras
 */
export function criarDocumentoPDF(recibo, config) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const centerX = pageWidth / 2;

  // 1. CABEÇALHO
  // Nome da profissional: Luciana Alonso Fernandes
  // Usamos estilo Itálico com fonte serif para simular o estilo manuscrito elegante original
  doc.setFont('times', 'italic');
  doc.setFontSize(22);
  doc.setTextColor(30, 30, 30);
  doc.text(config.emitenteNome || 'Luciana Alonso Fernandes', centerX, 35, { align: 'center' });

  // Subtítulo do cabeçalho: Fonoaudióloga CRFa 1-14891 1a Região CPF 056.045.466-07
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  const infoProfissional = `${config.emitenteRegistro} CPF ${config.emitenteCpf}`;
  doc.text(infoProfissional, centerX, 44, { align: 'center' });

  // 2. TÍTULO DO RECIBO
  // Ex: RECIBO R$ 1.250,00
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  const tituloRecibo = `RECIBO R$ ${formatarValorBRL(recibo.valor)}`;
  doc.text(tituloRecibo, centerX, 75, { align: 'center' });

  // 3. CORPO DO RECIBO
  doc.setFont('times', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(20, 20, 20);

  const textoCorpo = construirTextoRecibo(recibo, config);

  // Margens: 28mm à esquerda e à direita (largura útil: 154mm)
  const marginX = 28;
  const larguraTexto = pageWidth - (marginX * 2);
  const linhas = doc.splitTextToSize(textoCorpo, larguraTexto);

  let currentY = 90;
  // Renderização justificada das linhas
  doc.text(linhas, marginX, currentY, {
    maxWidth: larguraTexto,
    align: 'justify',
    lineHeightFactor: 1.45
  });

  // 4. DATA E LOCAL
  // Ex: Rio de Janeiro, 9 de novembro de 2026
  const dataExtenso = formatarDataPorExtenso(recibo.dataEmissao, config.cidade);
  const dataY = 135;
  doc.setFont('times', 'normal');
  doc.setFontSize(12);
  doc.text(dataExtenso, centerX, dataY, { align: 'center' });

  // 5. LINHA DE ASSINATURA E NOME
  const linhaY = 158;
  const linhaLargura = 110; // largura da linha de assinatura
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

/**
 * Ações com o PDF gerado
 */

export function gerarNomeArquivo(recibo) {
  const nomeLimpo = (recibo.pacienteNome || 'Paciente')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '_');
  const mes = (recibo.mesReferencia || 'Recibo').toLowerCase();
  const ano = recibo.anoReferencia || new Date().getFullYear();
  return `Recibo_${nomeLimpo}_${mes}_${ano}.pdf`;
}

export function abrirReciboPDF(recibo, config) {
  const doc = criarDocumentoPDF(recibo, config);
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}

export function baixarReciboPDF(recibo, config) {
  const doc = criarDocumentoPDF(recibo, config);
  const nomeArquivo = gerarNomeArquivo(recibo);
  doc.save(nomeArquivo);
}

export async function compartilharReciboWhatsApp(recibo, config) {
  const doc = criarDocumentoPDF(recibo, config);
  const blob = doc.output('blob');
  const nomeArquivo = gerarNomeArquivo(recibo);
  const file = new File([blob], nomeArquivo, { type: 'application/pdf' });

  const textoMensagem = `Olá, ${recibo.pacienteNome}! Segue o seu recibo referente às sessões de fonoaudiologia de ${recibo.mesReferencia}/${recibo.anoReferencia}. Atenciosamente, ${config.emitenteNome}.`;

  // Se o navegador móvel suportar compartilhamento nativo com arquivo
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

  // Fallback: faz download do arquivo e abre o WhatsApp com a mensagem
  doc.save(nomeArquivo);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(textoMensagem)}`;
  window.open(whatsappUrl, '_blank');
  return false;
}

/**
 * Gera relatório consolidado em PDF para IRPF ou prestação de contas
 */
export function criarRelatorioPDF(dadosRelatorio, config) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const centerX = pageWidth / 2;

  // Cabeçalho
  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.text('DECLARAÇÃO DE PAGAMENTOS DE SERVIÇOS', centerX, 25, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`Para fins de Comprovação e Imposto de Renda (IRPF) - Exercício ${dadosRelatorio.ano}`, centerX, 32, { align: 'center' });

  // Emitente
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.text(`Profissional: ${config.emitenteNome} | ${config.emitenteRegistro} | CPF: ${config.emitenteCpf}`, centerX, 40, { align: 'center' });

  doc.setLineWidth(0.3);
  doc.line(20, 44, pageWidth - 20, 44);

  // Paciente
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.text('DADOS DO PACIENTE:', 20, 52);
  doc.setFont('times', 'normal');
  doc.text(`Nome: ${dadosRelatorio.paciente.nome}`, 20, 58);
  doc.text(`CPF: ${dadosRelatorio.paciente.cpf}`, 20, 64);

  // Tabela de recibos
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

  // Totais
  startY += 5;
  doc.setFillColor(240, 247, 255);
  doc.rect(20, startY - 5, pageWidth - 40, 10, 'F');
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.text('TOTAL DE SESSÕES: ' + dadosRelatorio.totalSessoes, 25, startY + 1);
  doc.text('VALOR TOTAL PAGO: R$ ' + formatarValorBRL(dadosRelatorio.totalValor), 125, startY + 1);

  // Assinatura
  const dataHojeExtenso = formatarDataPorExtenso(new Date().toISOString().split('T')[0], config.cidade);
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.text(dataHojeExtenso, centerX, startY + 28, { align: 'center' });

  doc.line(centerX - 50, startY + 45, centerX + 50, startY + 45);
  doc.text(config.emitenteNome, centerX, startY + 51, { align: 'center' });

  return doc;
}
