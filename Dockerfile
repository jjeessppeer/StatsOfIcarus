# Create a docker container hosting the website.

FROM node:10
COPY package*.json ./
RUN npm install
COPY public /public
COPY *.js ./
EXPOSE 80
EXPOSE 443

VOLUME ["/databases", "/etc/letsencrypt/live/statsoficarus.xyz" "/logs", "/etc/letsencrypt/archive/statsoficarus.xyz"]

CMD ["node", "main.js"]