FROM node:10
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 80
EXPOSE 443

VOLUME ["/databases", "/certs", "/logs"]

CMD ["node", "main.js"]