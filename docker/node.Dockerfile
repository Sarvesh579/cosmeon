FROM oven/bun:latest

WORKDIR /app

COPY node-service .

RUN bun install

EXPOSE 4000

CMD ["bun", "server.ts"]