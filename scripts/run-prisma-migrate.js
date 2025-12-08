#!/usr/bin/env node

const path = require("path");
const { spawn } = require("child_process");
require("dotenv").config({
  path: path.resolve(process.cwd(), ".env"),
});

const ensureDatabaseUrl = () => {
  if (process.env.DATABASE_URL) {
    return;
  }

  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
  if (!DB_HOST || !DB_PORT || !DB_USER || !DB_PASSWORD || !DB_NAME) {
    console.error("Missing DB_* env vars and DATABASE_URL is not set. Please update your .env.");
    process.exit(1);
  }

  const encodedPassword = encodeURIComponent(DB_PASSWORD);
  process.env.DATABASE_URL = `mysql://${DB_USER}:${encodedPassword}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
};

const run = () => {
  ensureDatabaseUrl();

  const child = spawn("npx", ["prisma", "migrate", "dev"], {
    stdio: "inherit",
    shell: true,
  });

  child.on("exit", (code) => {
    process.exit(code);
  });
};

run();

