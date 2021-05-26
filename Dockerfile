# Create a docker container hosting the website.

FROM node:10
COPY package*.json ./
RUN npm install
COPY public /public
COPY *.js ./
EXPOSE 80
# EXPOSE 443

VOLUME ["/databases", "/certs/live" "/logs", "/certs/archive"]
CMD ["node", "main.js"]