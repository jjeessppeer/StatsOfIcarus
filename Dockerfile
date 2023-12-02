# Create a docker container hosting the website.
FROM node:14
COPY package*.json ./
RUN npm install
RUN npx babel ./ReactSrc --out-dir ./public/React
COPY public /public
COPY Server /Server
COPY tools /tools
COPY config.json ./

# COPY entrypoint.sh /entrypoint.sh
# RUN chmod +x /entrypoint.sh

EXPOSE 80
# EXPOSE 443

VOLUME ["/databases", "/logs", "/public"]
# ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "Server/main.js"]