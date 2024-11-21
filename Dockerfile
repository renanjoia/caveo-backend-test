# Build stage
FROM node:18-alpine AS builder

# Adiciona dependências necessárias para builds
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copia apenas os arquivos necessários para instalar dependências
COPY package*.json ./
COPY tsconfig.json ./

# Instala TODAS as dependências (incluindo devDependencies)
RUN npm install

# Copia o resto dos arquivos
COPY . .

# Garante que o diretório dist existe
RUN mkdir -p dist

# Executa o build com log detalhado
RUN npm run build --verbose

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copia apenas os arquivos necessários da stage de build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

# Instala apenas as dependências de produção
RUN npm ci --only=production

EXPOSE 3000

CMD ["npm", "start"]