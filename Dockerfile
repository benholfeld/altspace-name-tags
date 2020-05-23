FROM node:10.16-alpine
WORKDIR /opt/mre

COPY package*.json ./
RUN ["npm", "install", "axios --safe"]

COPY package*.json ./
RUN ["npm", "install", "--unsafe-perm"]

COPY package*.json ./
RUN ["npm", "install", "--save request request-promise-native"]

COPY package*.json ./
RUN ["npm", "install", "--save-dev @types/request @types/request-promise-native"]

COPY tsconfig.json ./
COPY src ./src/
RUN ["npm", "run", "build-only"]

COPY public ./public/

EXPOSE 3901/tcp
CMD ["npm", "start"]