# 🎒 TwoBolsos - Gestão Financeira Inteligente

> Um sistema de gestão financeira pessoal com módulo exclusivo para Motoristas de App e Entregadores. Controle seus ganhos, gastos, quilometragem e consumo de combustível em uma interface Mobile-First moderna.

![Badge Concluído](http://img.shields.io/static/v1?label=STATUS&message=CONCLUÍDO&color=GREEN&style=for-the-badge)
![Badge Python](http://img.shields.io/static/v1?label=Backend&message=FastAPI&color=blue&style=for-the-badge)
![Badge Mobile](http://img.shields.io/static/v1?label=Frontend&message=Mobile%20First&color=orange&style=for-the-badge)

---

## 📱 Sobre o Projeto

O **TwoBolsos** nasceu da necessidade de separar as finanças pessoais das finanças de trabalho (GIG Economy). Diferente de apps genéricos, ele permite criar "Carteiras" com comportamentos diferentes:

1.  **Carteira Padrão:** Para gestão doméstica, salário fixo e gastos pessoais.
2.  **Carteira Motorista:** Módulo especializado que rastreia **KM Rodado**, **Litros Abastecidos** e calcula métricas de eficiência.

### ✨ Funcionalidades Principais

* ✅ **Multi-Carteiras:** Gerencie "Mottu", "Casa", "Loja" separadamente.
* ✅ **Dashboard Real-Time:** Gráficos de fluxo de caixa (7, 15 ou 30 dias).
* ✅ **Módulo Driver:** Input específico para KM e Combustível nas transações.
* ✅ **Gestão de Contas Fixas:** Cadastre aluguel/faculdade e lance o pagamento com um clique (com trava de segurança contra duplicidade).
* ✅ **Interface Glassmorphism:** Design moderno (Dark Mode) focado em usabilidade no celular.
* ✅ **SPA Feel:** Interações sem recarregar a página.

---

## 🛠 Tecnologias Utilizadas

### Back-End
* **Python 3.10+**
* **FastAPI:** Framework de alta performance para APIs.
* **SQLModel (SQLAlchemy):** ORM para interação com banco de dados.
* **SQLite:** Banco de dados leve e embarcado.

### Front-End
* **HTML5 / CSS3:** Estilização com Glassmorphism.
* **Bootstrap 5:** Grid system e componentes responsivos.
* **JavaScript (Vanilla):** Lógica de consumo de API (Fetch) e manipulação de DOM.
* **Chart.js:** Renderização de gráficos dinâmicos.

---

## 🚀 Como Rodar o Projeto

### Pré-requisitos
* Python instalado.
* Git instalado.

### Passo a Passo

1. **Clone o repositório**
   ```bash
   git clone [https://github.com/K4nishi/TwoBolsos.git](https://github.com/SEU-USUARIO/TwoBolsos.git)
   cd TwoBolsos


Crie um ambiente virtual (Opcional, mas recomendado)


python -m venv venv
# Ativar no Windows:
.\venv\Scripts\activate
# Ativar no Linux/Mac:
source venv/bin/activate
Instale as dependências

1:
pip install -r requirements.txt
Execute o Servidor Entre na pasta do backend e rode o Uvicorn:
2:
cd back_end
uvicorn main:app --reload