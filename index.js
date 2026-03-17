const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
app.use(express.json());

// 1. Configura o robô para a Nuvem (Linux sem tela)
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'] // <-- OBRIGATÓRIO PARA O RAILWAY
    }
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('📱 LEIA ESTE QR CODE RAPIDAMENTE!');
});

client.on('ready', () => {
    console.log('🤖 Robô do WhatsApp CONECTADO nas nuvens!');
});

client.initialize();

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

// 2. A porta dinâmica da Nuvem
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Servidor do Robô rodando na porta ${PORT}`);
});