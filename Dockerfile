# Build stage
FROM node:18-alpine AS builder

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
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copia apenas os arquivos necessários da stage de build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Instala apenas as dependências de produção
RUN npm install --production

CMD ["npm", "start"]