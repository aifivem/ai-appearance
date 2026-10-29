import { aiLogChannels, createDatabaseTables } from "@aicore-fivem/lib/server";
import { ResourceName } from "common";
import { log } from "./log";
import { restoreOnline } from "./session";

aiLogChannels({ purchases: {} });

createDatabaseTables(ResourceName, "sql/main.sql")
  .then(restoreOnline)
  .catch((error: unknown) => log.error("database setup failed", error));
