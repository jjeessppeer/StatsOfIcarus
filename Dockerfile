# Create a docker container hosting the website.
FROM node:20
COPY package*.json ./
RUN npm install
COPY ./ ./
RUN npx babel ./ReactSrc --out-dir ./public/React

# COPY entrypoint.sh /entrypoint.sh
# RUN chmod +x /entrypoint.sh

EXPOSE 80
# EXPOSE 443

VOLUME ["/databases", "/logs", "/public"]
# ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "Server/main.js"]