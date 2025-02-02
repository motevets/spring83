FROM node:16 as base
WORKDIR /usr/src/spring83
COPY package*.json ./
RUN npm install
COPY common.js .
COPY root.tmpl.html .
COPY serve .
STOPSIGNAL SIGINT

FROM base as serve
ENV NODE_ENV=prod
ENV SPRING83_CONTENT_DIR=/content
ENV TZ="America/Los_Angeles"
CMD ["/usr/src/spring83/serve"]