import "server-only";
import fresh from "mongoose";

const cache = globalThis as typeof globalThis & {
  adminMongoose?: typeof fresh;
  adminMongooseConnection?: Promise<typeof fresh>;
};
export const mongoose = (cache.adminMongoose ??= fresh);

// Shared schemas must not automatically create collections or change database indexes.
mongoose.set("autoIndex", false);
mongoose.set("autoCreate", false);

export function defineModel<TSchema extends fresh.Schema>(name: string, schema: TSchema) {
  if (mongoose.models[name]) mongoose.deleteModel(name);
  return mongoose.model(name, schema);
}

/** Call before querying shared models. Uses the same database as the admin driver. */
export async function connectModels() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Admin database is not configured.");
  cache.adminMongooseConnection ??= mongoose.connect(uri, {
    dbName: process.env.MONGODB_DB_NAME || "healthmatrix",
    appName: "healthmatrix-super-admin-models",
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
    autoIndex: false,
    autoCreate: false,
  }).catch(() => {
    cache.adminMongooseConnection = undefined;
    throw new Error("Admin database is unavailable.");
  });
  return cache.adminMongooseConnection;
}
