# Swell Alert Bot 🌊

Um sistema backend em Node.js que monitora continuamente as condições marítimas (Swell) em Ubatuba/SP usando a API Open-Meteo. Quando as ondas atingem ou ultrapassam um limite pré-configurado (ex: 1.4 metros), ele envia automaticamente uma mensagem para um grupo ou número do WhatsApp via CallMeBot.

## Funcionalidades
* Monitoramento automático a cada 30 minutos via `node-cron`.
* Consulta de dados precisos e gratuitos do Open-Meteo (Marine API e Forecast API).
* Cálculo embutido de Energia da Onda (em Joules).
* Tratamento de proteção Anti-spam (Cooldown de 3 horas após cada notificação).
* Tradução automática de graus para Pontos Cardeais (N, NE, SE, etc).
* Servidor HTTP leve embutido para compatibilidade com hosts gratuitos.
* Logs estruturados no console.

## Como usar localmente

1. Clone o projeto e instale as dependências:
   ```bash
   npm install
   ```
2. Crie uma cópia do arquivo de configuração:
   ```bash
   cp .env.example .env
   ```
3. Obtenha sua API Key gratuita do CallMeBot para WhatsApp:
   - Acesse: https://www.callmebot.com/blog/free-api-whatsapp-messages/
   - Envie a mensagem de ativação conforme as instruções.
   - Coloque o `CALLMEBOT_API_KEY` e o `WHATSAPP_NUMBER` no arquivo `.env`.
   
4. Inicie o sistema:
   ```bash
   node index.js
   ```

## Opções de Hospedagem Gratuita (Recomendado)

O projeto foi preparado para rodar em plataformas que exigem um servidor Web HTTP, ao mesmo tempo em que o Cron roda no plano de fundo. 

**Opção 1: Render.com (Gratuito)**
1. Crie uma conta no Render e clique em **New > Web Service**.
2. Conecte ao seu repositório do GitHub com este código.
3. Configurações:
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`
4. Na aba **Environment**, adicione todas as variáveis que estão no seu `.env`.
5. **Atenção:** O plano gratuito do Render entra em modo "sleep" após 15 minutos sem receber acessos web. Como o nosso bot precisa rodar o cron interno a cada 30 min, você precisará manter o servidor "acordado". Use o site gratuito [cron-job.org](https://cron-job.org/en/) e configure para fazer um GET Request na URL do seu app (ex: `https://seu-app.onrender.com/health`) a cada 10 ou 14 minutos. Isso manterá o bot sempre rodando e os agendamentos do `node-cron` funcionarão perfeitamente!

**Opção 2: Koyeb.com (Gratuito)**
- Similar ao Render, mas em alguns planos/contas o servidor não "dorme". A configuração é a mesma (`node index.js` e preencher `.env`).

## Personalizando

- Para mudar o limite do alerta, altere a variável `TRIGGER_WAVE_HEIGHT` no arquivo `.env`.
- Para mudar a cidade alvo, altere as variáveis `LATITUDE` e `LONGITUDE`.
- O tempo de espera entre o envio de um alerta e o próximo para as mesmas condições é controlado pela variável `COOLDOWN_HOURS` (padrão: 3 horas).

## Tecnologias
* Node.js
* Express (Server para manter a porta aberta)
* Axios (Requisições HTTP para a API)
* Node-cron (Agendador interno)
* dotenv (Gerenciamento de variáveis)
