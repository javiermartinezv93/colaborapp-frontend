# Multi-stage build para Vue.js con Vite
FROM node:22.12-alpine AS build-stage

# Establecer directorio de trabajo
WORKDIR /app

# Copiar package files
COPY frontend/package*.json ./

# Instalar dependencias (incluye dev deps necesarias para la fase de build)
# Usamos --legacy-peer-deps para evitar fallos por conflictos de peerDependencies
RUN npm ci --legacy-peer-deps --no-audit --no-fund

# Copiar código fuente
COPY frontend/ .

# Construir la aplicación
RUN npm run build

# Etapa de producción con Nginx
FROM nginx:alpine AS production-stage

ADD nginx.conf /etc/nginx/nginx.conf
ADD default.conf /etc/nginx/conf.d/default.conf
COPY --from=build-stage /app/dist /home/vue_server/
# Copiar archivos construidos desde la etapa anterior

RUN ln -sf /dev/stdout /var/log/nginx/access.log && ln -sf /dev/stderr /var/log/nginx/error.log

EXPOSE 80
STOPSIGNAL SIGTERM
CMD ["nginx","-g","daemon off;"]
