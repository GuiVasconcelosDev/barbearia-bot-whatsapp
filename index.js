const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');

const app = express();
app.use(express.json());

// Variáveis para a nossa Tela de QR Code
let qrCodeAtual = "";
let roboConectado = false;

// 1. Configura o robô
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        executablePath: '/usr/bin/chromium', 
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// 2. Quando gerar o QR, guarda-o na variável em vez de o cuspir no terminal
client.on('qr', (qr) => {
    qrCodeAtual = qr;
    console.log('📱 Novo QR Code gerado! Abra o link do Railway no navegador para escanear.');
});

// 3. Quando conectar, limpa o QR Code e avisa
client.on('ready', () => {
    roboConectado = true;
    qrCodeAtual = "";
    console.log('🤖 Robô do WhatsApp CONECTADO nas nuvens! V@');
});

client.initialize();

// ==========================================
// A MÁGICA: TELA PÚBLICA DO QR CODE
// ==========================================
app.get('/', (req, res) => {
    // Se já estiver conectado, mostra uma tela verde
    if (roboConectado) {
        return res.send(`
            <div style="text-align: center; margin-top: 100px; font-family: sans-serif;">
                <h1 style="color: #10b981; font-size: 50px;">✅ Robô Conectado!</h1>
                <p style="color: #64748b; font-size: 20px;">O seu WhatsApp já está ligado ao servidor de lembretes.</p>
            </div>
        `);
    }

    // Se tiver um QR Code pronto, usa uma API externa gratuita para transformar o texto em Imagem
    if (qrCodeAtual) {
        const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(qrCodeAtual)}&size=350`;
        return res.send(`
            <div style="text-align: center; margin-top: 50px; font-family: sans-serif;">
                <h2 style="color: #1e293b;">📱 Escaneie o QR Code</h2>
                <p style="color: #64748b;">Abra o WhatsApp > Aparelhos Conectados > Conectar um Aparelho</p>
                <img src="${qrUrl}" alt="QR Code WhatsApp" style="margin-top: 20px; border: 2px solid #e2e8f0; border-radius: 16px; padding: 20px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);" />
                <p style="color: #ef4444; margin-top: 20px; font-weight: bold;">Atualize esta página (F5) se o QR Code expirar ou não funcionar à primeira.</p>
            </div>
        `);
    }

    // Se o robô ainda estiver a ligar
    return res.send(`
        <div style="text-align: center; margin-top: 100px; font-family: sans-serif;">
            <h2 style="color: #3b82f6;">⏳ A gerar QR Code...</h2>
            <p style="color: #64748b;">O robô está a aquecer os motores. Atualize a página daqui a 10 segundos.</p>
        </div>
    `);
});

// ==========================================
// ROTA ONDE O JAVA VAI BATER PARA ENVIAR A MENSAGEM
// ==========================================
app.post('/api/enviar', async (req, res) => {
    const { telefone, mensagem } = req.body;
    const numeroFormatado = `${telefone}@c.us`;

    try {
        await client.sendMessage(numeroFormatado, mensagem);
        console.log(`✅ Mensagem enviada para ${telefone}`);
        res.status(200).json({ sucesso: true, mensagem: "Enviado!" });
    } catch (erro) {
        console.error(`❌ Erro ao enviar para ${telefone}:`, erro);
        res.status(500).json({ sucesso: false, erro: erro.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Servidor do Robô rodando na porta ${PORT}`);
});