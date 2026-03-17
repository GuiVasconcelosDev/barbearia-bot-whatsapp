# 1. Usa um Linux super leve e oficial, já com o Node.js v22
FROM node:22-bullseye-slim

# 2. Impede o robô de baixar um Chrome inútil e pesado
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# 3. A MÁGICA: Instala o Chromium oficial do Linux com TODAS as bibliotecas gráficas à força
RUN apt-get update && apt-get install -y \
    chromium \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# 4. Prepara a pasta de trabalho
WORKDIR /app

# 5. Instala os seus pacotes Node
COPY package*.json ./
RUN npm install

# 6. Copia o resto do código
COPY . .

# 7. Liberta a porta de comunicação
EXPOSE 3001

# 8. A ordem final de arranque
CMD ["node", "index.js"]