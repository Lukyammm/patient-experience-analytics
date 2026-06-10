# 📊 Pesquisa de Satisfação — HUC

Sistema web para coleta, gestão e análise de pesquisas de satisfação de pacientes do Hospital Universitário do Ceará (HUC).

---

## 📝 Descrição objetiva

O **PESQUISA_SATISFACAO** é um WebApp desenvolvido em **Google Apps Script + Google Sheets + HTML/CSS/JS** que permite registrar, visualizar e exportar pesquisas de satisfação aplicadas às clínicas e setores hospitalares.

O sistema calcula automaticamente indicadores de **NPS (Net Promoter Score)**, **taxa de satisfação por setor** e **tabulação de manifestações** (sugestões, reclamações, comentários e elogios), com filtros dinâmicos e painel executivo em tempo real.

---

## 🚀 Funcionalidades

- Dashboard com KPIs e metas: pesquisas aplicadas, **% de aplicação** (meta 60%), **taxa de satisfação** (meta 90%), **NPS** com zona de classificação e manifestações
- Tabulação geral das avaliações: quantos **Ótimo / Bom / Regular / Ruim / N/A**
- Filtros por setor, tipo, sexo e período de data
- Indicadores por setor: pesquisas, saídas, % de aplicação, satisfação, NPS e manifestações
- Cadastro de **saídas hospitalares** por mês/setor (aba `SAIDAS`) para cálculo da % de aplicação
- **Relatório mensal automático** no formato institucional: tabela geral por setor, tabelas de critérios por bloco (Acolhimento, Assistência, Serviços Prestados) com a porcentagem ponderada, manifestações numeradas e botão Imprimir/PDF
- Formulário para nova pesquisa com avaliações por grupo: Acolhimento, Assistência e Serviços
- Tabela de registros com busca e edição
- Exportação em CSV

## 📐 Indicadores e fórmulas

- **Taxa de satisfação** = (Ótimo + Bom) / (Ótimo + Bom + Regular + Ruim) — respostas N/A não entram. Meta: 90%.
- **NPS** = (Promotores − Detratores) / total de respostas NPS, em %. Promotores: notas 9–10; Neutros: 7–8 (entram só no denominador); Detratores: 0–6. Zonas: ≥75% excelência, 50–74% qualidade, 0–49% aperfeiçoamento, <0% crítica.
- **Porcentagem por critério (score ponderado)** = (Ótimo×3 + Bom×2 + Regular×1 + Ruim×(−1)) / (avaliações válidas × 3). É a coluna "PORCENTAGEM" das tabelas do relatório mensal.
- **% de aplicação** = pesquisas aplicadas / saídas do setor no mês (altas, transferências externas e óbitos). Meta: 60%.

---

## 🛠️ Tecnologias

- Google Apps Script (backend)
- Google Sheets (banco de dados — abas `MATRIZ` e `SAIDAS`)
- HTML / CSS / JavaScript (frontend WebApp)

---

## ⚙️ Como publicar

1. Crie uma planilha Google com a aba `MATRIZ` (linhas a partir da linha 5).
2. Em `Extensões > Apps Script`, cole os arquivos `Code.gs` e `index.html`.
3. Implante em `Implantar > Nova implantação` como **Aplicativo da Web**:
   - Executar como: **Eu**
   - Quem pode acessar: **Sua organização** (ou conforme necessidade)
4. Copie o URL gerado e compartilhe com a equipe.
