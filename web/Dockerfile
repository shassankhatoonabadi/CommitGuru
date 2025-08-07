FROM node:18

WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
ENV NEXT_DISABLE_ESLINT true

EXPOSE 3000
CMD ["npx", "next", "start", "-p", "3000", "-H", "0.0.0.0"]