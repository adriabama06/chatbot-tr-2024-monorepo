FROM node:20.12.2-alpine3.19

RUN mkdir -p /app

COPY . /app

WORKDIR /app

RUN cd /app

RUN npm install

ENV NODE_ENV=production

RUN npm run build

CMD [ "npm", "run", "preview" ]