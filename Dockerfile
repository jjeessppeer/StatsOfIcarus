# Create a docker container hosting the website.

FROM node:14
COPY package*.json ./
RUN npm install
COPY public /public
COPY *.js ./
COPY MatchHistory/* ./MatchHistory/
COPY .env ./

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80
# EXPOSE 443

VOLUME ["/databases", "/logs", "/public"]
ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "main.js"]