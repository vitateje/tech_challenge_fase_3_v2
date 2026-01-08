# Guia de Formatação do Chat - Medical Assistant

## 📋 Visão Geral

O chat do Medical Assistant agora suporta formatação rica com Markdown para melhor visualização de tópicos, listas e informações estruturadas.

---

## ✨ Recursos de Formatação

### 1. **Cabeçalhos**

Você pode usar cabeçalhos de diferentes níveis:

```
# Cabeçalho Principal
## Cabeçalho Secundário
### Cabeçalho Terciário
```

**Como aparece:**
- H1: Fonte grande, azul, com borda inferior
- H2: Fonte média-grande, azul escuro
- H3: Fonte média, azul marinho

---

### 2. **Listas Numeradas**

```
1. Primeiro item
2. Segundo item
3. Terceiro item
```

**Como aparece:**
- Lista ordenada com numeração automática
- Espaçamento adequado entre itens
- Indentação apropriada

---

### 3. **Listas com Marcadores**

```
- Item com marcador
- Outro item
- Mais um item

* Alternativa com asterisco
* Também funciona
```

**Como aparece:**
- Lista não-ordenada com bullets
- Espaçamento adequado
- Visual limpo e organizado

---

### 4. **Texto em Negrito**

```
**Texto importante** ou __texto importante__
```

**Como aparece:**
- Destaque em azul (mensagens do assistente)
- Destaque em branco com sombra (mensagens do usuário)

---

### 5. **Texto em Itálico**

```
*Texto enfatizado* ou _texto enfatizado_
```

**Como aparece:**
- Texto inclinado com cor diferenciada
- Boa legibilidade

---

### 6. **Código Inline**

```
Use `código inline` para comandos ou termos técnicos
```

**Como aparece:**
- Fundo cinza claro (mensagens do assistente)
- Fundo semi-transparente (mensagens do usuário)
- Fonte monospace
- Cor destacada (vermelho)

---

### 7. **Blocos de Código**

```
\`\`\`
código em bloco
múltiplas linhas
\`\`\`
```

**Como aparece:**
- Fundo escuro (#1A202C)
- Texto verde (#48BB78)
- Borda esquerda azul
- Fonte monospace
- Scroll horizontal quando necessário

---

### 8. **Parágrafos**

Parágrafos são separados por linhas em branco duplas. O sistema automaticamente adiciona espaçamento adequado entre parágrafos.

---

## 🎨 Design Visual

### Mensagens do Usuário
- **Fundo**: Gradiente azul (#4299E1 → #3182CE)
- **Texto**: Branco
- **Sombra**: Suave com opacidade
- **Posição**: Alinhado à direita
- **Largura máxima**: 75% da área do chat

### Mensagens do Assistente
- **Fundo**: Branco
- **Texto**: Cinza escuro (#2D3748)
- **Borda**: Cinza claro (#E2E8F0)
- **Sombra**: Suave
- **Posição**: Alinhado à esquerda
- **Largura máxima**: 75% da área do chat

---

## 📚 Fontes de Informação

As fontes são exibidas em uma seção separada com:
- **Separador visual**: Linha superior
- **Ícone**: 📚
- **Tags clicáveis**: Com hover effect
- **Tooltip**: Mostra excerpt ao passar o mouse
- **Estilo**: Cards arredondados com borda

---

## ⚠️ Avisos de Revisão

Quando uma resposta requer validação médica:
- **Destaque visual**: Barra lateral vermelha
- **Ícone**: ⚠️
- **Fundo**: Rosa claro (#FFF5F5)
- **Texto**: Vermelho escuro (#742A2A)
- **Layout**: Flexbox com espaçamento

---

## 🎬 Animações

### Entrada de Mensagens
- **Efeito**: Slide-in suave de baixo para cima
- **Duração**: 0.3s
- **Timing**: ease-out
- **Opacidade**: Fade-in simultâneo

### Hover nos Tags de Fonte
- **Transformação**: Leve elevação (translateY)
- **Sombra**: Aumenta sutilmente
- **Duração**: 0.2s
- **Timing**: ease

---

## 🖱️ Interatividade

### Scroll Customizado
- **Largura**: 8px
- **Track**: Cinza claro (#F7FAFC)
- **Thumb**: Cinza médio (#CBD5E0)
- **Hover**: Cinza escuro (#A0AEC0)
- **Bordas**: Arredondadas

### Área de Chat
- **Fundo**: Gradiente sutil (top: #F7FAFC, bottom: #FFFFFF)
- **Padding**: 24px
- **Overflow**: Auto com scroll suave

---

## 📝 Exemplo de Uso Completo

```markdown
## Diagnóstico Diferencial

Baseado nos sintomas apresentados, considere:

### Possibilidades Principais

1. **Hipertensão Arterial Sistêmica**
   - Pressão sistólica elevada
   - História familiar positiva
   - Idade compatível

2. **Diabetes Mellitus Tipo 2**
   - Glicemia de jejum alterada
   - HbA1c aumentada
   - Obesidade (IMC > 30)

### Exames Complementares

- Glicemia de jejum
- Hemograma completo
- Perfil lipídico
- Função renal

### Recomendações

**Imediatas:**
- Iniciar monitoramento da PA
- Dieta hipossódica
- Atividade física regular

**Seguimento:**
- Retorno em *15 dias*
- Trazer resultados dos exames
- Avaliar necessidade de medicação

Use `lisinopril 10mg` como primeira linha se HAS confirmada.

\`\`\`
Esquema posológico:
- Lisinopril 10mg 1x/dia
- Ajustar dose conforme resposta
\`\`\`
```

**Como isso apareceria:**
- Cabeçalhos bem destacados
- Listas numeradas e com marcadores
- Texto em negrito e itálico
- Código inline para medicação
- Bloco de código para esquema

---

## 🚀 Benefícios

1. **Legibilidade Melhorada**: Hierarquia visual clara
2. **Organização**: Estruturação lógica do conteúdo
3. **Profissionalismo**: Aparência moderna e clean
4. **Usabilidade**: Fácil escaneamento da informação
5. **Acessibilidade**: Bom contraste e espaçamento

---

## 🔧 Implementação Técnica

### Sanitização XSS
- Escape de caracteres HTML (`<`, `>`, `&`)
- Proteção contra injeção de código
- Apenas tags específicas permitidas

### Performance
- Formatação client-side (Vue 3)
- Renderização eficiente com v-html
- Animações CSS otimizadas

### Compatibilidade
- Funciona em todos navegadores modernos
- Suporta mobile e desktop
- Responsive design

---

## 📱 Responsividade

- **Desktop**: Largura máxima 75%
- **Tablet**: Ajuste automático
- **Mobile**: Largura máxima 85%
- **Padding**: Adaptativo por viewport

---

## 🎯 Casos de Uso

### 1. Protocolos Clínicos
```markdown
## Protocolo de Dor Torácica

### Avaliação Inicial
1. Verificar sinais vitais
2. ECG em até 10 minutos
3. Troponina seriada
```

### 2. Diagnósticos Diferenciais
```markdown
## Diagnóstico Diferencial de Dispneia

**Causas Cardíacas:**
- ICC descompensada
- IAM
- TEP

**Causas Respiratórias:**
- Pneumonia
- DPOC exacerbado
- Asma
```

### 3. Prescrições e Orientações
```markdown
## Prescrição Sugerida

1. **Medicação de Base**
   - Enalapril 10mg 2x/dia
   - HCTZ 25mg 1x/dia

2. **Orientações**
   - Dieta com restrição de sódio
   - Exercícios regulares
   - Monitorar PA em casa
```

---

## 💡 Dicas de Uso

1. **Use cabeçalhos** para organizar seções
2. **Listas numeradas** para sequências e prioridades
3. **Listas com marcadores** para itens sem ordem específica
4. **Negrito** para termos importantes e diagnósticos
5. **Itálico** para ênfase suave
6. **Código inline** para medicações e termos técnicos
7. **Blocos de código** para protocolos e esquemas complexos
8. **Parágrafos separados** para melhor respiração visual

---

## 🔄 Próximos Passos

Melhorias futuras planejadas:
- [ ] Suporte a tabelas
- [ ] Links clicáveis
- [ ] Imagens inline
- [ ] Citações (blockquotes)
- [ ] Checkboxes interativos
- [ ] Export para PDF
- [ ] Compartilhamento de conversas

---

**Desenvolvido com ❤️ para profissionais de saúde**

