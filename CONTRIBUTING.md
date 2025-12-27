# 🤝 Guia de Contribuição

Obrigado pelo interesse em contribuir com o TwoBolsos! Este documento explica como você pode ajudar.

## 📋 Índice

1. [Código de Conduta](#código-de-conduta)
2. [Como Contribuir](#como-contribuir)
3. [Configurando o Ambiente](#configurando-o-ambiente)
4. [Padrões de Código](#padrões-de-código)
5. [Commits e Pull Requests](#commits-e-pull-requests)
6. [Reportando Bugs](#reportando-bugs)
7. [Sugerindo Melhorias](#sugerindo-melhorias)

---

## Código de Conduta

Este projeto segue um código de conduta para garantir um ambiente acolhedor:

- 🤝 Seja respeitoso e inclusivo
- 💬 Use linguagem acolhedora
- 🎯 Foque nas ideias, não nas pessoas
- 🙏 Aceite críticas construtivas
- ❤️ Mostre empatia com outros contribuidores

---

## Como Contribuir

### 1. Fork do Repositório

```bash
# Clone seu fork
git clone https://github.com/SEU_USUARIO/TwoBolsos.git
cd TwoBolsos

# Adicione o upstream
git remote add upstream https://github.com/K4nishi/TwoBolsos.git
```

### 2. Crie uma Branch

```bash
# Atualize a main
git checkout main
git pull upstream main

# Crie sua branch
git checkout -b feature/minha-feature
# ou
git checkout -b fix/correcao-bug
```

### 3. Faça suas Alterações

- Siga os padrões de código
- Adicione testes se possível
- Documente funções novas

### 4. Commit e Push

```bash
git add .
git commit -m "feat: adiciona nova funcionalidade X"
git push origin feature/minha-feature
```

### 5. Abra um Pull Request

1. Vá para seu fork no GitHub
2. Clique em "Compare & pull request"
3. Descreva suas alterações
4. Aguarde revisão

---

## Configurando o Ambiente

### Backend (Python)

```bash
# Entre no diretório
cd back_end

# Crie ambiente virtual
python -m venv venv

# Ative (Windows)
.\venv\Scripts\activate

# Ative (Linux/Mac)
source venv/bin/activate

# Instale dependências
pip install -r requirements.txt

# Rode o servidor
uvicorn app.main:app --reload
```

### Frontend (React)

```bash
# Entre no diretório
cd front_end

# Instale dependências
npm install

# Rode o servidor
npm run dev
```

### Testes

```bash
# Backend (quando disponível)
cd back_end
pytest

# Frontend (quando disponível)
cd front_end
npm test
```

---

## Padrões de Código

### Python (Backend)

- **Estilo:** PEP 8
- **Docstrings:** Google Style
- **Tipagem:** Use type hints

```python
def calcular_saldo(receitas: float, despesas: float) -> float:
    """
    Calcula o saldo baseado em receitas e despesas.
    
    Args:
        receitas: Total de receitas
        despesas: Total de despesas
        
    Returns:
        Saldo calculado (receitas - despesas)
    """
    return receitas - despesas
```

### TypeScript/React (Frontend)

- **Estilo:** ESLint config do projeto
- **Componentes:** Functional components com hooks
- **Tipagem:** TypeScript estrito

```tsx
interface WalletProps {
    id: number;
    nome: string;
    saldo: number;
}

const WalletCard: React.FC<WalletProps> = ({ id, nome, saldo }) => {
    return (
        <div className="wallet-card">
            <h3>{nome}</h3>
            <p>R$ {saldo.toFixed(2)}</p>
        </div>
    );
};
```

---

## Commits e Pull Requests

### Formato de Commit

Usamos [Conventional Commits](https://conventionalcommits.org/):

```
<tipo>(<escopo>): <descrição>

[corpo opcional]

[rodapé opcional]
```

### Tipos de Commit

| Tipo | Uso |
|------|-----|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `docs` | Documentação |
| `style` | Formatação (sem mudança de código) |
| `refactor` | Refatoração |
| `test` | Testes |
| `chore` | Manutenção (build, CI, etc) |

### Exemplos

```bash
feat(auth): adiciona recuperação de senha
fix(dashboard): corrige cálculo de saldo
docs(readme): adiciona instruções de deploy
refactor(api): simplifica rotas de transações
```

### Pull Request

- **Título:** Seguir formato de commit
- **Descrição:** Explicar O QUE e POR QUE
- **Screenshots:** Se houver mudanças visuais
- **Testes:** Listar testes realizados

---

## Reportando Bugs

### Antes de Reportar

1. Verifique se já não existe uma issue
2. Atualize para a última versão
3. Tente reproduzir o bug

### Criando a Issue

Use este template:

```markdown
## Descrição do Bug
[Descreva claramente o problema]

## Como Reproduzir
1. Vá para '...'
2. Clique em '...'
3. Role até '...'
4. Veja o erro

## Comportamento Esperado
[O que deveria acontecer]

## Screenshots
[Se aplicável]

## Ambiente
- OS: [Windows/Linux/Mac]
- Browser: [Chrome/Firefox/etc]
- Versão: [versão do TwoBolsos]

## Informações Adicionais
[Qualquer contexto extra]
```

---

## Sugerindo Melhorias

### Feature Requests

Abra uma issue com:

```markdown
## Resumo
[Descrição breve da feature]

## Motivação
[Por que essa feature seria útil?]

## Descrição Detalhada
[Como você imagina que funcionaria?]

## Alternativas Consideradas
[Outras soluções que você pensou]

## Contexto Adicional
[Screenshots, mockups, exemplos]
```

---

## 🎉 Reconhecimento

Todos os contribuidores serão listados no README!

Obrigado por ajudar a tornar o TwoBolsos melhor! 🎒
