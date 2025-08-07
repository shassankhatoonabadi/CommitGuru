FROM node:18

WORKDIR /app/core/worker
COPY ../.. /app
RUN npm install

RUN apt-get update && apt-get install -y python3 python3-pip && \
    if [ -f requirements.txt ]; then pip3 install -r requirements.txt; fi

CMD ["sh", "-c", "npx graphile-worker --connection $DATABASE_URL --install && node index.js"]