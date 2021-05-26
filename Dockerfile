# Create a docker container hosting the website.

FROM node:10
COPY package*.json ./
RUN npm install
COPY public /public
COPY *.js ./

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80
# EXPOSE 443

VOLUME ["/databases", "/certs/live" "/logs", "/certs/archive"]
ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "main.js"]