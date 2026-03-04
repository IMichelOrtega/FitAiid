# Usar una imagen base de Node.js ligera
FROM node:18-slim

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de producción
RUN npm install --omit=dev

# Copiar el resto del código
COPY . .

# Exponer el puerto configurado (por defecto 5000)
EXPOSE 5000

# Comando para iniciar la aplicación
CMD ["node", "src/server.js"]
