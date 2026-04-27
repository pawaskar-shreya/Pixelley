import "dotenv/config";

export { prisma } from "./client.js"
export * from "../generated/prisma/client.js";

console.log("Print froma---------------------" + process.env.DATABASE_URL)