import dotenv from "dotenv";
const env = dotenv.config({ path: "./.env" })

if (env.error) {
  console.error("Failed to load .env file:", env.error);
  // process.exit(1); // Optional: don't exit if just missing file in some envs
}

if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL is missing in environment variables.");
  process.exit(1);
}

export const config = {
  ENV: process.env.ENV ?? "local",
};
