FROM node:18

WORKDIR /app/core/worker
COPY core/worker/package*.json ./
RUN npm install
COPY . /app

RUN apt-get update && apt-get install -y python3 python3-pip && \
    if [ -f requirements.txt ]; then pip3 install --break-system-packages -r requirements.txt; fi

CMD ["sh", "-c", "npx graphile-worker --connection $DATABASE_URL --install && node index.js"]