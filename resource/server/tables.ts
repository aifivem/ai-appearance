// Generated from sql/main.sql by aicore-db-types (the build runs it). Do not edit: change the SQL and build.

/** Row of each table as @aicore-fivem/mysql returns it. */
export type Tables = {
  ai_appearance_characters: {
    char_id: number;
    model: string;
    data: string;
    updated_at: number;
  };
};

/** What an INSERT needs: columns with a default, NULL or AUTO_INCREMENT may be left out. */
export type TableInserts = {
  ai_appearance_characters: {
    char_id: number;
    model: string;
    data: string;
    updated_at?: number;
  };
};
