const SHEET_NAME = 'MATRIZ';
const FIRST_DATA_ROW = 5;
const LAST_COL = 43; // A:AQ

const COL = {
  setor:1, pront:2, data:3, tipo:4, dn:5, idade:6, sexo:7,
  gentilezaAcolhimento:8, agilidade:9, clareza:10, satisfacao1:11, obsAcolhimento:12,
  gentilezaAssistencia:13, identificacao:14, intimidade:15, horarioDescanso:16, esclarecimento:17, cuidados:18, confianca:19, satisfacao2:20, obsAssistencia:21,
  acesso:22, acomodacao:23, limpeza:24, enxoval:25, alimentacao:26, locomocao:27, satisfacao3:28, obsServicos:29,
  sugestoes:30, reclamacoes:31, comentarios:32, elogios:33, nps:34, entrevistador:35,
  otimo:36, bom:37, regular:38, ruim:39, na:40, totalConsiderado:41, taxaSatisfacao:42, encaminhamentos:43
};

const RATING_KEYS = [
  'gentilezaAcolhimento','agilidade','clareza','gentilezaAssistencia','identificacao','intimidade','horarioDescanso','esclarecimento','cuidados','confianca','acesso','acomodacao','limpeza','enxoval','alimentacao','locomocao'
];

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Pesquisa de Satisfação HUC')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getInitialData() {
  const sheet = getSheet_();
  ensureHeader_(sheet);
  const lastRow = Math.max(sheet.getLastRow(), FIRST_DATA_ROW - 1);
  const numRows = Math.max(0, lastRow - FIRST_DATA_ROW + 1);
  if (!numRows) return { records: [], lookups: { setores: [], tipos: [], sexos: [] } };

  const values = sheet.getRange(FIRST_DATA_ROW, 1, numRows, LAST_COL).getDisplayValues();
  const records = values.map((row, i) => rowToObject_(row, FIRST_DATA_ROW + i))
    .filter(r => hasContent_(r));

  return {
    records,
    lookups: {
      setores: unique_(records.map(r => r.setor)),
      tipos: unique_(records.map(r => r.tipo)),
      sexos: unique_(records.map(r => r.sexo))
    }
  };
}

function saveRecord(payload) {
  const sheet = getSheet_();
  ensureHeader_(sheet);
  const rowNumber = Number(payload.rowNumber) || nextDataRow_(sheet);
  const row = objectToRow_(payload);
  sheet.getRange(rowNumber, 1, 1, LAST_COL).setValues([row]);
  applyRowFormulas_(sheet, rowNumber);
  sheet.getRange(rowNumber, 1, 1, LAST_COL).setBorder(true, true, true, true, true, true, '#e2e8f0', SpreadsheetApp.BorderStyle.SOLID);
  return { ok: true, rowNumber, message: rowNumber === Number(payload.rowNumber) ? 'Registro atualizado.' : 'Registro salvo na MATRIZ.' };
}

function deleteRecord(rowNumber) {
  rowNumber = Number(rowNumber);
  if (!rowNumber || rowNumber < FIRST_DATA_ROW) throw new Error('Linha inválida.');
  getSheet_().deleteRow(rowNumber);
  return { ok: true, message: 'Registro excluído.' };
}

function exportCsv() {
  const data = getInitialData().records;
  const headers = ['Data','Setor','Prontuario','Tipo','DN','Idade','Sexo','Satisfacao %','NPS','Classificacao NPS','Sugestoes','Reclamacoes','Comentarios','Elogios','Entrevistador','Encaminhamentos'];
  const lines = [headers].concat(data.map(r => [
    r.data, r.setor, r.pront, r.tipo, r.dn, r.idade, r.sexo, r.taxaSatisfacao, r.nps, classifyNps_(r.nps), r.sugestoes, r.reclamacoes, r.comentarios, r.elogios, r.entrevistador, r.encaminhamentos
  ])).map(row => row.map(csvCell_).join(';'));
  return lines.join('\n');
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  return sheet;
}

function ensureHeader_(sheet) {
  if (sheet.getLastColumn() >= LAST_COL && sheet.getRange('A2').getValue() === 'SETOR') return;
  sheet.getRange('B1').setValue('PESQUISA DE SATISFAÇÃO');
  sheet.getRange(2,1,1,LAST_COL).setValues([[
    'SETOR','PRONT','DATA','TIPO','DN','IDADE','SEXO','1. ACOLHIMENTO','','','','','2. ASSISTÊNCIA','','','','','','','','','3. SERVIÇOS PRESTADOS','','','','','','','MANIFESTAÇÕES','','','','NPS','ENTREVISTADOR','TABULAÇÃO DOS DADOS','','','','','','ENCAMINHAMENTOS'
  ]]);
  sheet.getRange(3,1,1,LAST_COL).setValues([[
    '','','','','','','','GENTILEZA E ATENÇÃO','AGILIDADE','CLAREZA','SATISFAÇÃO I','OBSERVAÇÕES','GENTILEZA E ATENÇÃO','IDENTIFICAÇÃO','INTIMIDADE/PRIVACIDADE','HORÁRIO DE DESCANSO','ESCLARECIMENTO','CUIDADOS PRESTADOS','CONFIANÇA E SEGURANÇA','SATISFAÇÃO II','OBSERVAÇÕES','ACESSO','ACOMODAÇÃO','LIMPEZA','ENXOVAL','ALIMENTAÇÃO','LOCOMOÇÃO','SATISFAÇÃO III','OBSERVAÇÕES','SUGESTÕES','RECLAMAÇÕES','COMENTÁRIOS','ELOGIOS','','','ÓTIMO','BOM','REGULAR','RUIM','N/A','TOTAL CONSIDERADO','TAXA DE SATISFAÇÃO',''
  ]]);
  sheet.getRange('A1:AQ3').setFontWeight('bold').setBackground('#eaf2ff');
  sheet.setFrozenRows(3);
}

function rowToObject_(row, rowNumber) {
  const get = key => row[COL[key]-1] || '';
  const obj = { rowNumber };
  Object.keys(COL).forEach(k => obj[k] = get(k));
  obj.data = normalizeDate_(obj.data);
  obj.dn = normalizeDate_(obj.dn);
  obj.taxaSatisfacao = numberFromPercent_(obj.taxaSatisfacao);
  obj.otimo = Number(obj.otimo) || countRating_(row, 'ÓTIMO');
  obj.bom = Number(obj.bom) || countRating_(row, 'BOM');
  obj.regular = Number(obj.regular) || countRating_(row, 'REGULAR');
  obj.ruim = Number(obj.ruim) || countRating_(row, 'RUIM');
  obj.na = Number(obj.na) || countRating_(row, 'N/A');
  if (!obj.taxaSatisfacao) obj.taxaSatisfacao = satisfaction_(row) * 100;
  return obj;
}

function objectToRow_(p) {
  const row = Array(LAST_COL).fill('');
  Object.keys(COL).forEach(k => {
    if (p[k] !== undefined) row[COL[k]-1] = p[k];
  });
  row[COL.data-1] = parseDateOrText_(p.data);
  row[COL.dn-1] = parseDateOrText_(p.dn);
  return row;
}

function applyRowFormulas_(sheet, r) {
  sheet.getRange(r, COL.satisfacao1).setFormula(`=IFERROR((COUNTIF(H${r}:J${r};"ÓTIMO")+COUNTIF(H${r}:J${r};"BOM"))/(COUNTIF(H${r}:J${r};"ÓTIMO")+COUNTIF(H${r}:J${r};"BOM")+COUNTIF(H${r}:J${r};"REGULAR")+COUNTIF(H${r}:J${r};"RUIM"));0)`);
  sheet.getRange(r, COL.satisfacao2).setFormula(`=IFERROR((COUNTIF(M${r}:S${r};"ÓTIMO")+COUNTIF(M${r}:S${r};"BOM"))/(COUNTIF(M${r}:S${r};"ÓTIMO")+COUNTIF(M${r}:S${r};"BOM")+COUNTIF(M${r}:S${r};"REGULAR")+COUNTIF(M${r}:S${r};"RUIM"));0)`);
  sheet.getRange(r, COL.satisfacao3).setFormula(`=IFERROR((COUNTIF(V${r}:AA${r};"ÓTIMO")+COUNTIF(V${r}:AA${r};"BOM"))/(COUNTIF(V${r}:AA${r};"ÓTIMO")+COUNTIF(V${r}:AA${r};"BOM")+COUNTIF(V${r}:AA${r};"REGULAR")+COUNTIF(V${r}:AA${r};"RUIM"));0)`);
  sheet.getRange(r, COL.otimo).setFormula(`=COUNTIF(H${r}:AB${r};"ÓTIMO")`);
  sheet.getRange(r, COL.bom).setFormula(`=COUNTIF(H${r}:AB${r};"BOM")`);
  sheet.getRange(r, COL.regular).setFormula(`=COUNTIF(H${r}:AB${r};"REGULAR")`);
  sheet.getRange(r, COL.ruim).setFormula(`=COUNTIF(H${r}:AB${r};"RUIM")`);
  sheet.getRange(r, COL.na).setFormula(`=COUNTIF(H${r}:AB${r};"N/A")`);
  sheet.getRange(r, COL.totalConsiderado).setFormula(`=SUM(AJ${r}:AM${r})`);
  sheet.getRange(r, COL.taxaSatisfacao).setFormula(`=IFERROR((AJ${r}+AK${r})/AO${r};0)`);
  sheet.getRange(r, COL.satisfacao1, 1, 1).setNumberFormat('0.00%');
  sheet.getRange(r, COL.satisfacao2, 1, 1).setNumberFormat('0.00%');
  sheet.getRange(r, COL.satisfacao3, 1, 1).setNumberFormat('0.00%');
  sheet.getRange(r, COL.taxaSatisfacao, 1, 1).setNumberFormat('0.00%');
}

function nextDataRow_(sheet) {
  const last = Math.max(sheet.getLastRow(), FIRST_DATA_ROW - 1);
  const vals = last >= FIRST_DATA_ROW ? sheet.getRange(FIRST_DATA_ROW, 1, last - FIRST_DATA_ROW + 1, 1).getValues().flat() : [];
  const idx = vals.findIndex(v => !v);
  return idx >= 0 ? FIRST_DATA_ROW + idx : last + 1;
}

function hasContent_(r) {
  return ['setor','pront','data','tipo','sexo','nps','sugestoes','reclamacoes','comentarios','elogios'].some(k => String(r[k] || '').trim());
}

function unique_(arr) {
  return [...new Set(arr.map(v => String(v || '').trim()).filter(Boolean))].sort((a,b) => a.localeCompare(b, 'pt-BR'));
}

function countRating_(row, rating) {
  return RATING_KEYS.reduce((n, key) => n + (String(row[COL[key]-1]).toUpperCase() === rating ? 1 : 0), 0);
}

function satisfaction_(row) {
  const ot = countRating_(row, 'ÓTIMO');
  const bom = countRating_(row, 'BOM');
  const reg = countRating_(row, 'REGULAR');
  const ruim = countRating_(row, 'RUIM');
  const total = ot + bom + reg + ruim;
  return total ? (ot + bom) / total : 0;
}

function classifyNps_(nps) {
  const n = Number(nps);
  if (isNaN(n)) return '';
  if (n >= 9) return 'Promotor';
  if (n >= 7) return 'Neutro';
  return 'Detrator';
}

function csvCell_(v) {
  return '"' + String(v ?? '').replace(/"/g, '""') + '"';
}

function normalizeDate_(v) {
  if (!v) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const m = String(v).match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return `${m[3]}-${String(m[2]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`;
  return v;
}

function parseDateOrText_(s) {
  if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y,m,d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return s;
}

function numberFromPercent_(v) {
  if (v === '' || v == null) return 0;
  const s = String(v).replace('%','').replace(',','.');
  const n = Number(s);
  if (isNaN(n)) return 0;
  return n <= 1 ? n * 100 : n;
}
