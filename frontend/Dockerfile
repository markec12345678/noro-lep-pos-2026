FROM oven/bun:1.2

WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install

COPY . .

EXPOSE 8080

CMD ["bun", "run", "dev"]
