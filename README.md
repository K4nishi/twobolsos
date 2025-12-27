# 🎒 TwoBolsos - Gestão Financeira Pessoal

> **Substitua suas planilhas!** O TwoBolsos é um sistema de controle financeiro pessoal com atualizações em tempo real, perfeito para motoristas de aplicativo, famílias e freelancers.

![Status](http://img.shields.io/static/v1?label=STATUS&message=PRODUÇÃO&color=green&style=for-the-badge)
![Backend](http://img.shields.io/static/v1?label=Backend&message=FastAPI&color=009688&style=for-the-badge)
![Frontend](http://img.shields.io/static/v1?label=Frontend&message=React&color=61DAFB&style=for-the-badge)
![Cloud](http://img.shields.io/static/v1?label=Deploy&message=SquareCloud&color=5865F2&style=for-the-badge)

---

## 📖 Índice

1. [O que é o TwoBolsos?](#-o-que-é-o-twobolsos)
2. [Para quem é?](#-para-quem-é)
3. [Funcionalidades](#-funcionalidades)
4. [Sistema de Compartilhamento](#-sistema-de-compartilhamento-de-carteiras)
5. [🚀 Deploy na Square Cloud](#-deploy-na-square-cloud)
6. [Instalação Local - Windows](#️-instalação-local---windows)
7. [Instalação Local - Linux/Mac](#-instalação-local---linuxmac)
8. [🐳 Deploy com Docker](#-deploy-com-docker)
9. [Como Usar (Tutorial)](#-tutorial-de-uso)
10. [📚 Documentação da API](#-documentação-da-api)
11. [Estrutura do Projeto](#-estrutura-do-projeto)
12. [Tecnologias](#️-tecnologias)
13. [Roadmap](#-roadmap---futuras-implementações)
14. [Contribuição](#-contribuição)

---

## 🎯 O que é o TwoBolsos?

O TwoBolsos nasceu da frustração de usar **planilhas de Excel** para controlar finanças:

- 📱 Difícil de usar no celular
- 👨‍👩‍👧 Complicado compartilhar com a família
- 🚗 Motoristas de app precisam de cálculos específicos
- 🔄 Não atualiza em tempo real

O nome "**Dois Bolsos**" representa a ideia de separar seu dinheiro: um bolso para gastos pessoais, outro para trabalho, outro para a família... quantos você precisar!

---

## 🎯 Para quem é?

### 🚗 Motoristas de Aplicativo
*Uber, 99, iFood, Rappi, Loggi...*

Você sabe que o valor que aparece no app **não é seu lucro real**. Precisa descontar:
- ⛽ Combustível
- 🔧 Manutenção (óleo, pneu, revisão)
- 🍔 Alimentação durante corridas
- 📉 Desgaste do veículo

**O TwoBolsos calcula para você:**
- Autonomia do veículo (KM/Litro)
- Lucro real por quilômetro rodado
- Total de KM rodados no período

### 👨‍👩‍👧 Famílias e Casais
Crie uma carteira compartilhada onde todos veem:
- Quanto entrou de dinheiro
- Quanto saiu e em quê
- Quem gastou (identificação por usuário)
- Tudo **em tempo real** - sem precisar atualizar a página!

### 💼 Freelancers e Autônomos
Separe claramente o dinheiro de trabalho do pessoal. Saiba exatamente:
- Quanto você fatura
- Quanto gasta para trabalhar
- Qual seu lucro líquido

---

## ✨ Funcionalidades

| Recurso | Descrição |
|---------|-----------|
| 📊 **Multi-Carteiras** | Crie quantos "bolsos" precisar: Casa, Uber, Loja, Poupança... |
| 🔄 **Tempo Real** | Alterações aparecem instantaneamente para todos os membros |
| 👥 **Compartilhamento** | Convide pessoas com códigos temporários de 24h |
| 🔐 **Permissões** | Dono, Editor ou Visualizador |
| 🏷️ **Categorias** | Organize gastos: Alimentação, Transporte, Manutenção, Saúde... |
| 📈 **Gráficos** | Veja o fluxo de caixa e gastos por categoria |
| 🚗 **Modo Driver** | Controle de KM, litros e cálculos automáticos |
| 📅 **Despesas Fixas** | Cadastre contas mensais e não esqueça |
| 🌙 **Dark Mode** | Interface moderna e confortável |

---

## 👥 Sistema de Compartilhamento de Carteiras

Uma das principais funcionalidades do TwoBolsos é o **compartilhamento em tempo real**.

### Como funciona:

1. **O Dono cria a carteira** (ex: "Finanças da Casa")

2. **O Dono gera um código de convite:**
   - Acesse a carteira
   - Clique no menu (três pontos) → "Membros / Convidar"
   - Clique em "Gerar Código"
   - Um código de 6 caracteres é gerado (ex: `A3B5K9`)
   - O código expira em **24 horas**

3. **O convidado usa o código:**
   - Na tela principal, clica em "Entrar"
   - Digita o código recebido
   - Pronto! Já tem acesso à carteira

4. **Níveis de Permissão:**
   | Papel | O que pode fazer |
   |-------|------------------|
   | **Dono** | Tudo: editar, deletar, convidar, remover membros |
   | **Editor** | Adicionar e deletar transações |
   | **Visualizador** | Apenas ver os dados (não modifica nada) |

5. **Tempo Real:**
   - Quando alguém adiciona uma transação, **todos os membros veem instantaneamente**
   - Um indicador verde 🟢 ao lado do nome da carteira mostra que você está conectado
   - Indicador vermelho 🔴 significa conexão perdida (atualize a página)

---

## 🚀 Deploy na Square Cloud

### Método 1: Import Direto do GitHub (Recomendado)

O TwoBolsos já está configurado para deploy direto do GitHub na Square Cloud!

#### Pré-requisitos
- Conta na [Square Cloud](https://squarecloud.app)
- Repositório no GitHub com o código

#### Passo a Passo

1. **Acesse o Dashboard da Square Cloud**
   - Vá para [squarecloud.app/dashboard](https://squarecloud.app/dashboard)

2. **Clique em "Add Application"**

3. **Selecione "Import from GitHub"**

4. **Autorize o acesso ao seu repositório**

5. **Selecione o repositório TwoBolsos**

6. **Aguarde o deploy automático**
   - A Square Cloud detecta automaticamente o arquivo `squarecloud.app`
   - Instala as dependências do `requirements.txt`
   - Inicia o servidor

7. **Acesse sua aplicação**
   - URL padrão: `https://twobolsos.squareweb.app`
   - Ou configure um domínio personalizado

### Arquivo de Configuração (`squarecloud.app`)

O projeto já inclui o arquivo de configuração:

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

### Configurações Explicadas

| Parâmetro | Valor | Descrição |
|-----------|-------|-----------|
| `DISPLAYNAME` | TwoBolsos API | Nome exibido no painel |
| `MAIN` | back_end/app/main.py | Arquivo principal da aplicação |
| `MEMORY` | 1024 | Memória em MB (1GB para o plano de R$7) |
| `VERSION` | recommended | Versão do Python (automática) |
| `START` | uvicorn... | Comando para iniciar o servidor |
| `SUBDOMAIN` | twobolsos | Subdomínio (twobolsos.squareweb.app) |
| `AUTORESTART` | true | Reinicia automaticamente se cair |

### Configuração de Webhook (Deploy Automático)

Para deploys automáticos quando fizer push:

1. No Dashboard Square Cloud, copie a URL do Webhook

2. No GitHub, vá em Settings → Webhooks → Add webhook

3. Cole a URL do webhook

4. Selecione "application/json"

5. Pronto! Cada push fará deploy automático

### Variáveis de Ambiente

Se precisar configurar variáveis (recomendado para produção):

1. No Dashboard Square Cloud, vá em Settings

2. Adicione as variáveis:
   ```
   SECRET_KEY=sua_chave_super_secreta_aqui
   DATABASE_PATH=/app/data/twobolsos.db
   ```

---

## 🖥️ Instalação Local - Windows

### Pré-requisitos
- [Python 3.10+](https://www.python.org/downloads/) (marque "Add to PATH" durante instalação)
- [Node.js 18+](https://nodejs.org/)
- [Git](https://git-scm.com/downloads)

### Passo a Passo

```powershell
# 1. Clone o repositório
git clone https://github.com/K4nishi/TwoBolsos.git
cd TwoBolsos

# 2. Crie o ambiente virtual Python
python -m venv venv
.\venv\Scripts\activate

# 3. Instale as dependências do Backend
pip install -r back_end/requirements.txt

# 4. Instale as dependências do Frontend
cd front_end
npm install
cd ..

# 5. Execute o sistema
.\start_dev.bat
```

O navegador abrirá automaticamente em `http://localhost:5173`

---

## 🐧 Instalação Local - Linux/Mac

### Pré-requisitos
- Python 3.10+ (`python3 --version`)
- Node.js 18+ (`node --version`)
- Git (`git --version`)

### Passo a Passo

```bash
# 1. Clone o repositório
git clone https://github.com/K4nishi/TwoBolsos.git
cd TwoBolsos

# 2. Dê permissão ao script
chmod +x start_dev.sh

# 3. Execute (o script instala tudo automaticamente na primeira vez)
./start_dev.sh
```

O script irá:
- Criar o ambiente virtual Python (se não existir)
- Instalar dependências do Backend
- Instalar dependências do Frontend
- Iniciar ambos os servidores

Acesse: `http://localhost:5173`

Para encerrar: pressione `CTRL+C`

---

## 🐳 Deploy com Docker

A forma tradicional de colocar o TwoBolsos em produção usando Docker.

### Pré-requisitos
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Deploy Rápido

```bash
# 1. Clone o repositório
git clone https://github.com/K4nishi/TwoBolsos.git
cd TwoBolsos

# 2. Configure a URL da API
echo "API_URL=http://SEU_IP_DO_SERVIDOR:8000" > .env

# 3. Execute o deploy
./deploy.sh up     # Linux/Mac
deploy.bat up      # Windows
```

### Comandos do Deploy Script

| Comando | Descrição |
|---------|-----------|
| `./deploy.sh up` | Constrói e inicia os containers |
| `./deploy.sh stop` | Para os containers |
| `./deploy.sh restart` | Reinicia os containers |
| `./deploy.sh logs` | Visualiza os logs em tempo real |
| `./deploy.sh update` | Atualiza código e reconstrói |
| `./deploy.sh status` | Mostra status dos containers |
| `./deploy.sh clean` | Remove tudo (cuidado!) |

---

## 📚 Tutorial de Uso

### 1️⃣ Criar uma Conta

1. Acesse a aplicação
2. Clique em "**Não tem conta? Crie uma agora**"
3. Preencha: usuário, email e senha
4. Clique em "**Criar Conta**"

### 2️⃣ Fazer Login

1. Digite seu usuário e senha
2. Clique em "**Entrar**"

### 3️⃣ Criar sua Primeira Carteira

1. Na tela principal, clique em "**+ Novo Bolso**"
2. Escolha um nome (ex: "Minhas Finanças")
3. Escolha a categoria:
   - **PADRÃO**: Para uso geral
   - **MOTORISTA**: Ativa o painel de KM e combustível
4. Escolha uma cor para identificar
5. Clique em "**Criar**"

### 4️⃣ Adicionar Transações

1. Entre na carteira clicando nela
2. Use os botões:
   - 🟢 **Entrada**: Dinheiro que entrou (salário, vendas, gorjetas)
   - 🔴 **Saída**: Dinheiro que saiu (compras, contas, combustível)
3. Preencha: valor, descrição, categoria e data
4. Confirme

### 5️⃣ Compartilhar com Alguém

1. Dentro da carteira, clique nos 3 pontos (menu)
2. Clique em "**Membros / Convidar**"
3. Clique em "**Gerar Código**"
4. Envie o código de 6 letras para a pessoa
5. A pessoa faz login na conta dela e clica em "**Entrar**" (na tela principal)
6. Digita o código e pronto!

### 6️⃣ Para Motoristas: Registrar KM

Se a carteira for do tipo MOTORISTA:
1. Um painel extra aparece com estatísticas
2. Ao adicionar transações, preencha os campos de KM e Litros
3. O sistema calcula automaticamente a autonomia

---

## 📚 Documentação da API

### Swagger UI (Interativo)
Após iniciar o backend, acesse:
```
http://localhost:8000/docs
```

### ReDoc (Alternativo)
```
http://localhost:8000/redoc
```

### Endpoints Principais

#### Autenticação
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/auth/register` | Criar nova conta |
| POST | `/auth/token` | Login (retorna JWT) |

#### Carteiras
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/negocios` | Listar carteiras |
| POST | `/negocios` | Criar carteira |
| DELETE | `/negocios/{id}` | Deletar carteira |
| GET | `/negocios/{id}/dashboard` | Dados completos da carteira |

#### Compartilhamento
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/negocios/{id}/invite` | Gerar código de convite |
| POST | `/negocios/join?code=XXXXXX` | Entrar com código |
| GET | `/negocios/{id}/members` | Listar membros |
| PATCH | `/negocios/{id}/members/{uid}` | Alterar permissão |
| DELETE | `/negocios/{id}/members/{uid}` | Remover membro |

#### Transações
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/transacoes` | Criar transação |
| DELETE | `/transacoes/{id}` | Deletar transação |

#### Despesas Fixas
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/negocios/{id}/fixas` | Listar fixas |
| POST | `/negocios/{id}/fixas` | Criar fixa |
| POST | `/negocios/{id}/fixas/{fid}/pagar` | Pagar fixa do mês |
| DELETE | `/negocios/{id}/fixas/{fid}` | Deletar fixa |

#### WebSocket
| Endpoint | Descrição |
|----------|-----------|
| `ws://URL/ws/{user_id}` | Conexão para tempo real |

---

## 📁 Estrutura do Projeto

```
TwoBolsos/
├── squarecloud.app              # ⭐ Config do Square Cloud
├── back_end/                    # API Python/FastAPI
│   ├── app/
│   │   ├── main.py              # Entrada da aplicação
│   │   ├── auth.py              # Autenticação JWT
│   │   ├── database.py          # Configuração do banco
│   │   ├── models.py            # Modelos de dados
│   │   ├── routers/             # Rotas da API
│   │   │   ├── auth.py          # Login/Registro
│   │   │   ├── negocios.py      # Carteiras
│   │   │   ├── transacoes.py    # Transações
│   │   │   └── fixas.py         # Despesas fixas
│   │   └── realtime/
│   │       └── manager.py       # WebSocket
│   ├── requirements.txt         # Dependências Python
│   ├── Dockerfile               # Container do backend
│   └── twobolsos.db             # Banco SQLite (gerado)
│
├── front_end/                   # Interface React
│   ├── src/
│   │   ├── pages/               # Telas (Login, Dashboard, etc)
│   │   ├── components/          # Componentes reutilizáveis
│   │   ├── context/             # Estados globais
│   │   ├── services/            # Conexão com API
│   │   └── types/               # Tipos TypeScript
│   ├── package.json             # Dependências Node
│   └── Dockerfile               # Container do frontend
│
├── docker-compose.yml           # Orquestração Docker
├── start_dev.bat                # Script Windows
├── start_dev.sh                 # Script Linux/Mac
├── deploy.sh                    # Script de deploy
└── README.md                    # Este arquivo
```

---

## 🛠️ Tecnologias

### Backend
| Tecnologia | Uso |
|------------|-----|
| Python 3.10+ | Linguagem principal |
| FastAPI | Framework web de alta performance |
| SQLModel | ORM (mapeamento objeto-relacional) |
| SQLite | Banco de dados local |
| WebSockets | Comunicação em tempo real |
| JWT | Autenticação segura |
| Uvicorn | Servidor ASGI |

### Frontend
| Tecnologia | Uso |
|------------|-----|
| React 19 | Biblioteca de interfaces |
| TypeScript | JavaScript com tipagem |
| Vite | Build tool ultrarrápido |
| TailwindCSS | Estilização utilitária |
| Chart.js | Gráficos interativos |
| Axios | Requisições HTTP |
| Framer Motion | Animações |
| Lucide Icons | Ícones |

### Infraestrutura
| Tecnologia | Uso |
|------------|-----|
| Square Cloud | Hospedagem principal |
| Docker | Containerização |
| Nginx | Proxy reverso (Docker) |

---

## 🗺️ Roadmap - Futuras Implementações

### Em Breve
- [ ] 📄 **Exportar para PDF/Excel** - Relatórios mensais
- [ ] 🎯 **Metas de Economia** - Defina objetivos e acompanhe
- [ ] 🔔 **Notificações** - Alerta de contas a vencer

### Futuro
- [ ] 💼 **Módulo Pequenos Negócios** 
  - Controle de estoque
  - Registro de vendas
  - Relatório de lucro
- [ ] 📱 **App Mobile (React Native)**
  - Versão Android e iOS
  - Notificações push
- [ ] 🏦 **Integração Bancária (Open Banking)**
  - Importação automática de transações
  - Categorização inteligente
- [ ] 📊 **Dashboard Avançado**
  - Comparativo entre meses
  - Previsão de gastos
  - Análise de tendências

---

## 🤝 Contribuição

O TwoBolsos é um projeto open source! Contribuições são muito bem-vindas.

### Como Contribuir

1. Faça um Fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Faça commit das mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

### Reportar Bugs

Abra uma [Issue](https://github.com/K4nishi/TwoBolsos/issues) descrevendo:
- O que aconteceu
- O que você esperava
- Passos para reproduzir
- Screenshots (se possível)

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## 👨‍💻 Autor

Desenvolvido por **K4nishi** 

[![GitHub](https://img.shields.io/badge/GitHub-K4nishi-181717?style=flat&logo=github)](https://github.com/K4nishi)

---

<div align="center">

### 🎒 TwoBolsos

*Seus bolsos. Sua organização. Seu controle.*

**[⬆ Voltar ao topo](#-twobolsos---gestão-financeira-pessoal)**

</div>