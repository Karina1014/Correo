# Usa una imagen oficial de Node.js
FROM node:18-alpine

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos del proyecto
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto de los archivos
COPY . .

# Expone el puerto en el que corre el backend
EXPOSE 3002

# Comando para iniciar el backend
CMD ["node", "server.js"]
