# Etapa de build
FROM node:20 AS build
WORKDIR /app

# Copiar package.json e instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar el código fuente
COPY . .

# Compilar TypeScript a JavaScript
RUN npm run build

# Etapa de runtime
FROM node:20-alpine
WORKDIR /app

# Copiar solo lo necesario
COPY --from=build /app/package*.json ./
RUN npm install --only=production
COPY --from=build /app/dist ./dist

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["node", "dist/app.js"]
