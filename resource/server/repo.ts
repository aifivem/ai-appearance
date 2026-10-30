import { createDatabaseTables } from "@aicore-fivem/lib/server";
import { mysql } from "@aicore-fivem/mysql";
import { ResourceName } from "common";
import { toAppearance, type Appearance } from "common/appearance";
import { log } from "./log";

/** Our table exists (installed at start); reads wait for it. */
export const tablesReady: Promise<void> = createDatabaseTables(
  ResourceName,
  "sql/main.sql",
).catch((error: unknown) => log.error("database setup failed", error));

interface Row {
  char_id: number;
  data: string;
}

function parse(row: Row): Appearance | null {
  try {
    const appearance = toAppearance(JSON.parse(row.data));
    if (!appearance)
      log.warn(
        `stored look of character ${row.char_id} is invalid, it starts over`,
      );
    return appearance;
  } catch (error) {
    log.error(`stored look of character ${row.char_id} is not JSON`, error);
    return null;
  }
}

/** Looks of the given characters (missing or broken ones are left out). */
export async function loadAppearances(
  charIds: number[],
): Promise<Map<number, Appearance>> {
  const out = new Map<number, Appearance>();
  if (charIds.length === 0) return out;
  const rows = await mysql.query<Row[]>(
    "SELECT char_id, data FROM ai_appearance_characters WHERE char_id IN (?)",
    [charIds],
  );
  for (const row of rows ?? []) {
    const appearance = parse(row);
    if (appearance) out.set(row.char_id, appearance);
  }
  return out;
}

export async function saveAppearance(
  charId: number,
  appearance: Appearance,
): Promise<void> {
  await mysql.query(
    `INSERT INTO ai_appearance_characters (char_id, model, data) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE model = VALUES(model), data = VALUES(data)`,
    [charId, appearance.model, JSON.stringify(appearance)],
  );
}
