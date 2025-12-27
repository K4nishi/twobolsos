# 🚀 Guia de Deploy - Square Cloud

Este guia detalha como fazer o deploy do TwoBolsos na Square Cloud usando importação direta do GitHub.

## 📋 Índice

1. [Requisitos](#requisitos)
2. [Preparação do Repositório](#preparação-do-repositório)
3. [Deploy na Square Cloud](#deploy-na-square-cloud)
4. [Configuração do Frontend](#configuração-do-frontend)
5. [Variáveis de Ambiente](#variáveis-de-ambiente)
6. [Solução de Problemas](#solução-de-problemas)

---

## Requisitos

### Square Cloud
- Conta ativa na [Square Cloud](https://squarecloud.app)
- Plano com pelo menos **1GB de RAM** (R$7/mês é suficiente)

### GitHub
- Repositório público ou privado com acesso autorizado
- Webhook configurado (opcional, para deploy automático)

---

## Preparação do Repositório

### 1. Estrutura Necessária

O repositório deve conter:

```
TwoBolsos/
├── squarecloud.app          # ⭐ OBRIGATÓRIO - Configuração do deploy
├── back_end/
│   ├── requirements.txt     # ⭐ OBRIGATÓRIO - Dependências Python
│   └── app/
│       └── main.py          # ⭐ OBRIGATÓRIO - Ponto de entrada
└── ...
```

### 2. Arquivo squarecloud.app

Este arquivo JÁ ESTÁ CONFIGURADO no projeto:

```ini
DISPLAYNAME=TwoBolsos API
MAIN=back_end/app/main.py
MEMORY=1024
VERSION=recommended
DESCRIPTION=Sistema de gestão financeira pessoal com WebSocket
START=uvicorn back_end.app.main:app --host 0.0.0.0 --port 80
SUBDOMAIN=twobolsos
AUTORESTART=true
```

### 3. Arquivo requirements.txt

Localizado em `back_end/requirements.txt`:

```
fastapi
uvicorn[standard]
sqlmodel
sqlalchemy
python-jose[cryptography]
passlib[bcrypt]
bcrypt==4.0.1
websockets
python-multipart
```

---

## Deploy na Square Cloud

### Passo 1: Acessar o Dashboard

1. Acesse [squarecloud.app/dashboard](https://squarecloud.app/dashboard)
2. Faça login com sua conta

### Passo 2: Criar Nova Aplicação

1. Clique no botão **"+ Add"** ou **"Nova Aplicação"**
2. Selecione **"Import from GitHub"**

### Passo 3: Conectar GitHub

1. Autorize a Square Cloud a acessar seu GitHub
2. Selecione o repositório **TwoBolsos**
3. Aguarde a validação do `squarecloud.app`

### Passo 4: Confirmar Deploy

1. Revise as configurações detectadas
2. Clique em **"Deploy"**
3. Aguarde a instalação das dependências

### Passo 5: Verificar Status

1. No Dashboard, veja o status da aplicação
2. Deve aparecer como **"Online"** (verde)
3. Clique para ver os logs e URL

---

## Configuração do Frontend

### Opção A: Hospedar Separadamente (Recomendado para Produção)

Para melhor performance, hospede o frontend separadamente:

#### Vercel (Grátis)
```bash
cd front_end
npm install -g vercel
vercel
```

Configure a variável de ambiente:
```
VITE_API_URL=https://twobolsos.squareweb.app
```

#### Netlify (Grátis)
1. Conecte o repositório
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Environment: `VITE_API_URL=https://twobolsos.squareweb.app`

### Opção B: Mesmo Servidor (Desenvolvimento)

Para testes, você pode servir arquivos estáticos do FastAPI:

1. Faça o build do frontend: `npm run build`
2. Copie a pasta `dist` para o backend
3. Configure o FastAPI para servir arquivos estáticos

---

## Variáveis de Ambiente

### Variáveis Recomendadas para Produção

No Dashboard da Square Cloud → Settings → Variables:

| Variável | Valor | Obrigatório |
|----------|-------|-------------|
| `SECRET_KEY` | sua-chave-secreta-aqui | ⚠️ Altamente recomendado |
| `DATABASE_PATH` | /app/data/twobolsos.db | Opcional |

### Como Gerar uma Secret Key

```python
import secrets
print(secrets.token_urlsafe(32))
```

### Aplicar no Código

Edite `back_end/app/auth.py`:

```python
import os

SECRET_KEY = os.environ.get("SECRET_KEY", "chave-padrao-insegura")
```

---

## Solução de Problemas

### ❌ Erro: "Application failed to start"

**Causa:** Dependências não instaladas ou erro no código.

**Solução:**
1. Verifique se `requirements.txt` está correto
2. Veja os logs no Dashboard
3. Teste localmente antes do deploy

### ❌ Erro: CORS bloqueando requisições

**Causa:** Frontend em domínio diferente do backend.

**Solução:** Já configurado em `main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especifique os domínios
    ...
)
```

### ❌ WebSocket não conecta

**Causa:** Protocol mismatch (ws vs wss).

**Solução:** 
- HTTP: use `ws://`
- HTTPS: use `wss://`

No frontend, detecte automaticamente:
```javascript
const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
```

### ❌ Banco de dados não persiste

**Causa:** Sem volume persistente.

**Solução:** 
A Square Cloud persiste dados automaticamente na pasta da aplicação.
Verifique se `DATABASE_PATH` aponta para dentro do container.

### ❌ Deploy automático não funciona

**Causa:** Webhook não configurado.

**Solução:**
1. No Dashboard Square Cloud, copie a URL do Webhook
2. No GitHub: Settings → Webhooks → Add webhook
3. Payload URL: URL copiada
4. Content type: `application/json`

---

## 📊 Logs e Monitoramento

### Ver Logs em Tempo Real

No Dashboard:
1. Clique na sua aplicação
2. Vá em **"Logs"**
3. Acompanhe em tempo real

### Métricas de Uso

- CPU: Deve ficar abaixo de 80%
- Memória: Deve ficar abaixo de 900MB (para 1GB)
- Rede: Monitore requests/segundo

---

## 🔄 Atualizando a Aplicação

### Via GitHub (com Webhook)
Apenas faça push para o repositório:
```bash
git add .
git commit -m "Nova feature"
git push
```

### Via Dashboard
1. Vá em **Deploy**
2. Clique em **"Redeploy"**

---

## 📞 Suporte

- **Square Cloud:** [Discord](https://discord.gg/squarecloud)
- **TwoBolsos:** [Issues no GitHub](https://github.com/K4nishi/TwoBolsos/issues)
