# Etapa 1: clonamos el repo
FROM alpine/git as git-clone

WORKDIR /src

# Clonamos el repo
RUN git clone --single-branch --branch master https://github.com/ismaele1992/StreamchatWebApp.git

# Etapa 2: build del frontend
FROM node:18 as frontend-build

WORKDIR /app

# Copiamos solo el frontend
COPY --from=git-clone /src/StreamchatWebApp/Streamchat.UI/streamchat-vue-app /app

# Instalamos dependencias del frontend
RUN npm install

# Compilamos el frontend
RUN npm run build

# Etapa 3: backend final + servir frontend
FROM node:18

WORKDIR /usr/src/app

# Copiamos el backend
COPY --from=git-clone /src/StreamchatWebApp/Streamchat.Webserver /usr/src/app

# Copiamos el dist del frontend
COPY --from=frontend-build /app/dist /usr/src/app/dist

# Instalamos dependencias del backend
RUN npm install

# Exponemos los puertos
EXPOSE 80 443

# Arrancamos el backend
CMD [ "node", "index.js" ]