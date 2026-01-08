# 🧪 Teste de Formatação do Chat

## Como Testar as Melhorias

### 1️⃣ Inicie o Frontend (se não estiver rodando)

```bash
cd frontend
npm run dev
```

### 2️⃣ Acesse o Sistema

Abra no navegador: `http://localhost:5173` (ou a porta que o Vite mostrar)

### 3️⃣ Faça Login

Use suas credenciais ou registre um novo usuário.

### 4️⃣ Vá para "Assistente IA"

Clique no menu lateral: **🤖 Assistente IA**

### 5️⃣ Envie as Mensagens de Teste

---

## 📝 Mensagem de Teste 1: Protocolo Clínico

Copie e cole no chat:

```
## Protocolo de Atendimento - Hipertensão Arterial

### Critérios Diagnósticos

1. **Pressão arterial sistólica** ≥ 140 mmHg
2. **Pressão arterial diastólica** ≥ 90 mmHg
3. Confirmação em pelo menos *duas consultas* diferentes

### Avaliação Inicial

- História clínica completa
- Exame físico detalhado
- Investigação de lesões em órgãos-alvo
- Identificação de fatores de risco

### Classificação da Hipertensão

1. **Estágio 1**: PA 140-159/90-99 mmHg
2. **Estágio 2**: PA 160-179/100-109 mmHg
3. **Estágio 3**: PA ≥ 180/110 mmHg

### Tratamento Não-Farmacológico

- Dieta DASH (rica em frutas, verduras e grãos integrais)
- Redução de sódio (<2g/dia)
- Exercícios aeróbicos regulares (30min, 5x/semana)
- Controle de peso (IMC < 25)
- Cessação do tabagismo
- Moderação do consumo de álcool

### Tratamento Farmacológico

Use `enalapril 10mg 1x/dia` ou `losartana 50mg 1x/dia` como primeira linha.

Medicações alternativas:
- `hidroclorotiazida 25mg`
- `anlodipino 5mg`
- `atenolol 50mg`

### Esquema Terapêutico

```
Monoterapia inicial:
- IECA ou BRA-II
- Ajustar dose após 4 semanas

Terapia combinada (se PA não controlada):
- IECA/BRA-II + Diurético tiazídico
- ou IECA/BRA-II + Bloqueador de canal de cálcio
```

### Acompanhamento

1. Retorno em **15 dias** para ajuste inicial
2. Consultas mensais até controle adequado
3. Após controle: acompanhamento trimestral
4. Monitorização domiciliar da PA

### Sinais de Alerta

⚠️ **Encaminhar para emergência se:**
- PA ≥ 180/120 mmHg com sintomas
- Dor torácica
- Dispneia grave
- Alteração do nível de consciência
- Déficit neurológico focal
```

---

## 📝 Mensagem de Teste 2: Diagnóstico Diferencial

Copie e cole no chat:

```
## Diagnóstico Diferencial - Dor Torácica

### Causas Cardíacas

1. **Síndrome Coronariana Aguda**
   - Dor precordial em aperto
   - Irradiação para MSE, mandíbula ou dorso
   - Associada a sudorese, náuseas
   - *Alterações isquêmicas no ECG*

2. **Pericardite**
   - Dor pleurítica
   - Melhora ao sentar e inclinar para frente
   - Atrito pericárdico à ausculta

3. **Dissecção de Aorta**
   - Dor súbita, lancinante
   - Irradiação para dorso
   - Assimetria de pulsos

### Causas Respiratórias

- **Pneumonia**: Febre, tosse produtiva, dispneia
- **Pneumotórax**: Dor súbita, dispneia, diminuição MV
- **TEP**: Dispneia súbita, taquicardia, hipoxemia
- **Pleurite**: Dor pleurítica, atrito pleural

### Causas Digestivas

- *DRGE*: Pirose, regurgitação
- *Espasmo esofágico*: Dificuldade de deglutição
- *Colecistite*: Dor em hipocôndrio direito após alimentação

### Causas Musculoesqueléticas

- Costocondrite
- Trauma
- Dor miofascial

### Propedêutica Inicial

1. ECG de 12 derivações
2. Troponina seriada (0h, 3h, 6h)
3. Radiografia de tórax
4. Gasometria arterial se hipoxemia
5. D-dímero se suspeita de TEP

### Estratificação de Risco

Use os critérios de **HEART score** ou **GRACE score**

### Conduta Imediata

- Monitorização cardíaca contínua
- Acesso venoso
- Oxigenoterapia se necessário
- AAS `300mg` VO se suspeita de SCA
- Nitroglicerina sublingual (se PA adequada)

⚠️ **Esta avaliação requer validação médica presencial**
```

---

## 📝 Mensagem de Teste 3: Lista de Exames

Copie e cole no chat:

```
## Exames Laboratoriais Solicitados

### Perfil Metabólico Completo

1. **Glicemia de Jejum**
   - Valor de referência: 70-100 mg/dL
   - Jejum de 8-12 horas

2. **Hemoglobina Glicada (HbA1c)**
   - Normal: < 5.7%
   - Pré-diabetes: 5.7-6.4%
   - Diabetes: ≥ 6.5%

3. **Perfil Lipídico**
   - Colesterol total: < 190 mg/dL
   - LDL: < 130 mg/dL (< 70 se alto risco)
   - HDL: > 40 mg/dL (homens), > 50 mg/dL (mulheres)
   - Triglicerídeos: < 150 mg/dL

### Função Renal

- **Creatinina**: 0.6-1.2 mg/dL
- **Ureia**: 15-40 mg/dL
- **TFG estimada**: > 60 mL/min/1.73m²

Use a fórmula `CKD-EPI` para cálculo da TFG

### Hemograma Completo

- Hemoglobina
- Hematócrito
- Leucócitos com diferencial
- Plaquetas

### Eletrólitos

- Sódio (135-145 mEq/L)
- Potássio (3.5-5.0 mEq/L)
- Cálcio (8.5-10.5 mg/dL)

### Função Hepática

- TGO/AST
- TGP/ALT
- Bilirrubinas
- Fosfatase alcalina

### Orientações para Coleta

```
Preparo:
- Jejum de 8-12 horas
- Hidratação normal
- Evitar exercício físico intenso 24h antes
- Manter medicações de uso contínuo
```

### Prazo para Resultados

- Hemograma: *24 horas*
- Bioquímica: *24-48 horas*
- HbA1c: *48-72 horas*

### Retorno

Agendar retorno em **7 dias** para avaliação dos resultados
```

---

## 📝 Mensagem de Teste 4: Prescrição Médica

Copie e cole no chat:

```
## Prescrição Médica Sugerida

### Identificação do Paciente

- Paciente: João Silva
- Idade: 55 anos
- Diagnóstico: *Hipertensão Arterial Sistêmica + Diabetes Mellitus Tipo 2*

### Medicações de Base

1. **Enalapril 10mg**
   - Tomar `1 comprimido` pela manhã
   - Via oral
   - Uso contínuo

2. **Metformina 850mg**
   - Tomar `1 comprimido` 2x/dia (café e jantar)
   - Via oral, junto às refeições
   - Uso contínuo

3. **Anlodipino 5mg**
   - Tomar `1 comprimido` à noite
   - Via oral
   - Uso contínuo

4. **AAS 100mg**
   - Tomar `1 comprimido` pela manhã
   - Via oral
   - Uso contínuo

### Medicações de Resgate

- **Captopril 25mg sublingual**
- Usar se PA > 160/100 mmHg
- Máximo 2 comprimidos/dia

### Orientações Gerais

#### Dieta
- Reduzir sal (< 2g sódio/dia)
- Aumentar consumo de frutas e verduras
- Evitar alimentos processados
- Fracionamento: 5-6 refeições/dia

#### Atividade Física
- Caminhada: *30 minutos/dia*, 5x/semana
- Iniciar gradualmente
- Respeitar limitações

#### Monitorização
- Medir PA em casa: 2x/dia (manhã e noite)
- Glicemia capilar: em jejum e 2h pós-prandial
- Anotar valores em caderneta

### Esquema Posológico

```
Manhã (jejum):
  - Enalapril 10mg
  - AAS 100mg
  - Metformina 850mg (no café)

Tarde:
  - -

Noite (jantar):
  - Metformina 850mg
  - Anlodipino 5mg (ao deitar)
```

### Exames de Controle

1. Glicemia de jejum - mensal
2. HbA1c - trimestral
3. Creatinina + potássio - mensal (IECA)
4. Hemograma - semestral

### Próxima Consulta

📅 Retorno em **30 dias**

Trazer:
- Caderneta de PA e glicemia
- Resultados de exames
- Lista de medicações em uso

⚠️ **Atenção**: Suspender metformina 24h antes de exames com contraste

⚠️ **Esta prescrição requer validação médica e assinatura**
```

---

## ✅ O Que Observar

Ao testar as mensagens acima, você deverá ver:

### ✨ Formatação
- ✅ Cabeçalhos em tamanhos diferentes e cores azuis
- ✅ Texto em **negrito** destacado
- ✅ Texto em *itálico* enfatizado
- ✅ Listas numeradas organizadas
- ✅ Listas com marcadores bem espaçadas
- ✅ Código inline com fundo e cor diferenciada
- ✅ Blocos de código com fundo escuro
- ✅ Parágrafos bem espaçados

### 🎨 Visual
- ✅ Mensagens com sombras suaves
- ✅ Gradiente azul nas suas mensagens
- ✅ Fundo branco nas mensagens do assistente
- ✅ Bordas arredondadas
- ✅ Boa hierarquia visual

### 🎬 Animações
- ✅ Mensagens aparecem com slide-in suave
- ✅ Hover nos botões tem transição
- ✅ Scroll suave e customizado

### 📚 Fontes
- ✅ Seção de fontes separada visualmente
- ✅ Tags clicáveis com hover effect
- ✅ Ícone 📚 antes de "Fontes"

### ⚠️ Avisos
- ✅ Avisos de revisão bem destacados
- ✅ Cor vermelha clara de fundo
- ✅ Barra lateral colorida
- ✅ Ícone ⚠️ visível

---

## 📱 Teste em Diferentes Dispositivos

1. **Desktop**: Largura completa, mensagens ocupam 75% da área
2. **Tablet**: Responsivo, ajuste automático
3. **Mobile**: Mensagens ocupam mais espaço (85%)

---

## 🐛 Possíveis Problemas

### Se o estilo não aparecer:
```bash
# Limpe o cache do navegador
Ctrl+Shift+R (Chrome/Firefox)
Cmd+Shift+R (Mac)

# Ou reinicie o servidor de desenvolvimento
cd frontend
npm run dev
```

### Se a formatação não funcionar:
- Verifique se usou duas linhas em branco entre parágrafos
- Confirme que os símbolos markdown estão corretos
- Teste com mensagens mais simples primeiro

---

## 🎯 Próximos Passos

Após testar:
1. ✅ Experimente suas próprias mensagens
2. ✅ Teste com perguntas reais ao assistente
3. ✅ Veja como as respostas da IA ficam formatadas
4. ✅ Compartilhe feedback sobre melhorias

---

## 📞 Dúvidas?

Consulte os guias:
- `frontend/CHAT_FORMATTING_GUIDE.md` - Guia completo
- `frontend/MELHORIAS_CHAT.md` - Resumo das melhorias

---

**🎉 Aproveite o chat melhorado!**

