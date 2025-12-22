# 🎒 TwoBolsos - Gestão Financeira Pessoal

> **Substitua suas planilhas!** O TwoBolsos é um sistema de controle financeiro pessoal com atualizações em tempo real, perfeito para motoristas de aplicativo, famílias e freelancers.

![Status](http://img.shields.io/static/v1?label=STATUS&message=EM%20DESENVOLVIMENTO&color=yellow&style=for-the-badge)
![Backend](http://img.shields.io/static/v1?label=Backend&message=FastAPI&color=009688&style=for-the-badge)
![Frontend](http://img.shields.io/static/v1?label=Frontend&message=React&color=61DAFB&style=for-the-badge)

---

## 📖 Índice

1. [O que é o TwoBolsos?](#-o-que-é-o-twobolsos)
2. [Para quem é?](#-para-quem-é)
3. [Funcionalidades](#-funcionalidades)
4. [Sistema de Compartilhamento](#-sistema-de-compartilhamento-de-carteiras)
5. [Instalação - Windows](#-instalação---windows)
6. [Instalação - Linux/Mac](#-instalação---linuxmac)
7. [🐳 Instalação com Docker](#-instalação-com-docker)
8. [Como Usar (Tutorial)](#-tutorial-de-uso)
9. [Estrutura do Projeto](#-estrutura-do-projeto)
10. [Tecnologias](#-tecnologias)
11. [Roadmap](#-roadmap---futuras-implementações)
12. [Contribuição](#-contribuição)

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

## 🖥️ Instalação - Windows

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
pip install -r requirements.txt

# 4. Instale as dependências do Frontend
cd front_end
npm install
cd ..

# 5. Execute o sistema
.\start_dev.bat
```

O navegador abrirá automaticamente em `http://localhost:5173`

---

## 🐧 Instalação - Linux/Mac

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

## 🐳 Instalação com Docker

A forma mais fácil de colocar o TwoBolsos em produção é usando Docker. Ideal para:
- Servidores VPS (DigitalOcean, AWS, Azure, etc.)
- Raspberry Pi
- Qualquer máquina com Docker instalado

### Pré-requisitos
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/) (geralmente já vem com Docker Desktop)

### Deploy Rápido

```bash
# 1. Clone o repositório
git clone https://github.com/K4nishi/TwoBolsos.git
cd TwoBolsos

# 2. Configure a URL da API (substitua pelo IP do seu servidor)
# Edite o arquivo .env.example e renomeie para .env
# ou crie diretamente:
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

### Deploy Manual com Docker Compose

```bash
# Construir e iniciar
docker compose up -d --build

# Verificar status
docker compose ps

# Ver logs
docker compose logs -f

# Parar
docker compose down
```

### Configuração para Produção

1. **Altere a URL da API** no arquivo `.env`:
   ```
   API_URL=http://seu-servidor.com:8000
   ```

2. **Para usar HTTPS** (recomendado), configure um proxy reverso com Nginx ou use o arquivo `docker-compose.prod.yml`

3. **Portas utilizadas**:
   - `80`: Frontend (React/Nginx)
   - `8000`: Backend (FastAPI)

### Persistência de Dados

O banco de dados SQLite é salvo em um volume Docker chamado `backend_data`. Para backup:

```bash
# Copiar banco de dados do container
docker cp twobolsos-backend:/app/data/twobolsos_v2.db ./backup/

# Restaurar
docker cp ./backup/twobolsos_v2.db twobolsos-backend:/app/data/
```

### Atualizando o Sistema

Para atualizar quando houver novas versões:

```bash
# Puxa as últimas alterações e reconstrói
git pull origin main
./deploy.sh update
```

---

## 📚 Tutorial de Uso

### 1️⃣ Criar uma Conta

1. Acesse `http://localhost:5173`
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
2. Clique em "**Fechar KM**"
3. Digite a quilometragem atual do veículo
4. O sistema calcula automaticamente a distância percorrida

---

## 📁 Estrutura do Projeto

```
TwoBolsos/
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
│   └── twobolsos.db             # Banco SQLite (gerado)
│
├── front_end/                   # Interface React
│   ├── src/
│   │   ├── pages/               # Telas (Login, Dashboard, etc)
│   │   ├── components/          # Componentes reutilizáveis
│   │   ├── context/             # Estados globais
│   │   ├── services/            # Conexão com API
│   │   └── types/               # Tipos TypeScript
│   ├── index.html
│   └── package.json
│
├── start_dev.bat                # Script Windows
├── start_dev.sh                 # Script Linux/Mac
├── requirements.txt             # Dependências Python
├── .gitignore
└── README.md
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

### Frontend
| Tecnologia | Uso |
|------------|-----|
| React 18 | Biblioteca de interfaces |
| TypeScript | JavaScript com tipagem |
| Vite | Build tool ultrarrápido |
| Chart.js | Gráficos |
| Axios | Requisições HTTP |
| Lucide Icons | Ícones |

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