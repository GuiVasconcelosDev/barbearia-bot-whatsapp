🤖 Bot de WhatsApp - SaaS Barbearia (Node.js & IA)
Este projeto é um assistente virtual inteligente para o WhatsApp, desenvolvido em Node.js. Ele atua como rececionista virtual das barbearias cadastradas no sistema SaaS, conversando naturalmente com os clientes e interagindo diretamente com a base de dados do backend (Spring Boot) através de chamadas à API.

🚀 Tecnologias Utilizadas
Ambiente: Node.js

Inteligência Artificial: Google Gemini 1.5 Flash (@google/generative-ai)

Mensageria: whatsapp-web.js (para escutar e enviar mensagens no WhatsApp)

Integração: fetch nativo do Node para comunicação HTTP.

✨ Principais Funcionalidades
1. Atendimento Natural (IA Generativa)
O bot não depende de menus engessados (ex: "Digite 1 para X"). Ele utiliza o modelo Gemini 1.5 Flash instruído com um System Prompt específico para atuar de forma simpática e natural como rececionista da barbearia.

2. Execução de Ferramentas (Function Calling)
O grande diferencial deste bot é a sua capacidade de tomar decisões e executar código real. O Gemini foi configurado com ferramentas (Tools) que ele mesmo decide quando usar:

consultar_horarios_livres: A IA entende quando o cliente quer saber os horários, faz um GET na API Java, lê a resposta e informa o cliente de forma natural.

marcar_agendamento: A IA recolhe os dados necessários na conversa (nome, horário pretendido) e dispara um POST para a API Java, inserindo o cliente diretamente na base de dados oficial.
