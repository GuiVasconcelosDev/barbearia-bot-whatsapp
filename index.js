require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_JAVA_URL = "https://barbearia-saas-api-production.up.railway.app"; 

const genAI = new GoogleGenerativeAI(process.env.numtemchave);


const ferramentasSaaS = [{
    functionDeclarations: [
        {
            name: "consultar_horarios_livres",
            description: "Consulta os horários livres da barbearia para o dia de hoje.",
            parameters: {
                type: "OBJECT",
                properties: {
                    barbeariaId: { type: "INTEGER", description: "ID da barbearia" }
                },
                required: ["barbeariaId"]
            }
        },
        {
            name: "marcar_agendamento",
            description: "Marca um corte de cabelo na agenda oficial do sistema.",
            parameters: {
                type: "OBJECT",
                properties: {
                    nomeCliente: { type: "STRING", description: "Nome do cliente" },
                    telefoneCliente: { type: "STRING", description: "WhatsApp do cliente" },
                    horario: { type: "STRING", description: "Horário escolhido, ex: 2026-03-21T15:00:00" },
                    servicoId: { type: "INTEGER", description: "ID do serviço (ex: 1 para Corte)" },
                    barbeiroId: { type: "INTEGER", description: "ID do barbeiro (ex: 1 para João)" }
                },
                required: ["nomeCliente", "telefoneCliente", "horario", "servicoId", "barbeiroId"]
            }
        }
    ]
}];

// Inicializamos o modelo com as ferramentas
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    tools: ferramentasSaaS 
});

// 2. A MÁQUINA DE EXECUÇÃO (As funções reais que batem no seu Java)
const funcoesReais = {
    consultar_horarios_livres: async ({ barbeariaId }) => {
        // Aqui o Node.js faz um GET no seu Java
        try {
            const resposta = await fetch(`${API_JAVA_URL}/api/agendamentos/barbearia/${barbeariaId}/livres`);
            const dados = await resposta.json();
            return { horarios_disponiveis: dados }; // Devolve a lista para o Gemini
        } catch (e) {
            return { erro: "Não foi possível aceder à agenda no momento." };
        }
    },
    marcar_agendamento: async (dadosMarcacao) => {
        // Aqui o Node.js faz um POST no seu Java (Igual ao que o React faz!)
        try {
            const resposta = await fetch(`${API_JAVA_URL}/api/agendamentos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    barbearia: { id: 1 }, // Fixo para testes, depois dinâmico
                    barbeiro: { id: dadosMarcacao.barbeiroId },
                    servico: { id: dadosMarcacao.servicoId },
                    cliente: { nome: dadosMarcacao.nomeCliente, telefone: dadosMarcacao.telefoneCliente },
                    dataHoraInicio: dadosMarcacao.horario
                })
            });
            return { sucesso: true, mensagem: "Agendamento confirmado no banco de dados!" };
        } catch (e) {
            return { sucesso: false, erro: "Falha ao gravar no sistema." };
        }
    }
};


client.on('message', async msg => {
    if (msg.from === 'status@broadcast' || msg.author) return;

    const mensagemCliente = msg.body;
    const telefoneCliente = msg.from.replace(/\D/g, ''); // Limpa o número

    try {
        
        const chat = model.startChat({
            systemInstruction: `Você é o recepcionista virtual de uma barbearia. 
            O cliente chama-se (ou tem o WhatsApp) ${telefoneCliente}.
            Seja simpático e natural. Se ele perguntar horários, USE A FERRAMENTA consultar_horarios_livres.
            Se ele quiser marcar, recolha o nome dele e USE A FERRAMENTA marcar_agendamento. 
            O ID da barbearia é 1, do serviço padrão é 1 e do barbeiro é 1.
            [REGRAS OBRIGATORIAS]
            1. que todo xingamento seja devolvido para o usuario de forma light.
            2. que usuario possa ser informado os cortes disponiveis que está no banco de dados.
            3. sempre memorize o termino da conversa para encerrar de vez.`
        });

        
        let result = await chat.sendMessage(mensagemCliente);
        let response = result.response;

        
        const functionCall = response.functionCalls ? response.functionCalls[0] : null;

        if (functionCall) {
            console.log(`🤖 A IA decidiu usar a ferramenta: ${functionCall.name}`);
            
            // Executa a função real no nosso Node.js
            const nomeFuncao = functionCall.name;
            const argumentos = functionCall.args;
            const resultadoDaAPI = await funcoesReais[nomeFuncao](argumentos);

            // Devolvemos o resultado (os horários ou a confirmação) de volta para a IA formular a resposta final
            result = await chat.sendMessage([{
                functionResponse: {
                    name: nomeFuncao,
                    response: resultadoDaAPI
                }
            }]);
            response = result.response;
        }

        
        await msg.reply(response.text());

    } catch (error) {
        console.error("Erro no fluxo da IA:", error);
    }
});

