import dotenv from "dotenv";
const env = dotenv.config({ path: "./.env" })

if (env.error) {
  console.error("Failed to load .env file:", env.error);
  // process.exit(1); // Optional: don't exit if just missing file in some envs
}

export const config = {
  ENV: process.env.ENV ?? "local",
  USER_DEFAULT_PASSWORD: process.env.USER_DEFAULT_PASSWORD ?? "Password123!",
};
