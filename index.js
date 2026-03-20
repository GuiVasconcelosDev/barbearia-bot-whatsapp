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
        // Este caminho deve bater com o que está no seu Dockerfile
        executablePath: '/usr/bin/chromium', 
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// 2. Evento de QR Code
client.on('qr', (qr) => {
    qrCodeAtual = qr;
    console.log('📱 Novo QR Code gerado!');
});

// 3. Evento de Pronto
client.on('ready', () => {
    roboConectado = true;
    qrCodeAtual = "";
    console.log('🤖 Robô do WhatsApp CONECTADO!');
});

client.initialize();

// ==========================================
// TELA DO QR CODE (Frontend simples)
// ==========================================
app.get('/', (req, res) => {
    if (roboConectado) {
        return res.send(`
            <div style="text-align: center; margin-top: 100px; font-family: sans-serif;">
                <h1 style="color: #10b981;">✅ Robô Conectado!</h1>
                <p>O sistema de lembretes está ativo.</p>
            </div>
        `);
    }

    if (qrCodeAtual) {
        const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(qrCodeAtual)}&size=350`;
        return res.send(`
            <div style="text-align: center; margin-top: 50px; font-family: sans-serif;">
                <h2>📱 Escaneie o QR Code</h2>
                <img src="${qrUrl}" />
                <p>Atualize a página (F5) se o código expirar.</p>
            </div>
        `);
    }

    return res.send('<div style="text-align: center; margin-top: 100px;"><h2>⏳ Gerando QR Code...</h2></div>');
});

// ==========================================
// ROTA DE ENVIO (Onde o Java bate)
// ==========================================
app.post('/api/enviar', async (req, res) => {

    const CHAVE_SECRETA = "eu-era-feliz-antes-de-2006";

    const chaveRecebida = req.headers['x-api-key'];
    if (chaveRecebida !== CHAVE_SECRETA) {
        console.error("⚠️ ALERTA: Tentativa de envio bloqueada (Chave Invalida).");
        return res.status(401).json({sucesso: false, erro: "Acesso negado"});
    }

    const { telefone, mensagem } = req.body;
    

    if (!roboConectado) {
        console.error(`⚠️ Bloqueado: Robô não está conectado.`);
        return res.status(400).json({ sucesso: false, erro: "Robô desconectado" });
    }

    const numeroFormatado = `${telefone}@c.us`;

    try {
        await client.sendMessage(numeroFormatado, mensagem);
        console.log(`✅ Enviado para ${telefone}`);
        res.status(200).json({ sucesso: true });
    } catch (erro) {
        console.error(`❌ Erro ao enviar:`, erro);
        res.status(500).json({ sucesso: false, erro: erro.message });
    }
});

// ==========================================
// O QUE FALTA: LIGA O SERVIDOR NA PORTA DO RAILWAY
// ==========================================
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Robô online na porta ${PORT}`);
});