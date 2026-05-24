use rusqlite::{Connection, Result};
use std::path::Path;
use std::sync::Mutex;

pub struct DatabaseManager {
    pub conn: Mutex<Connection>,
}

impl DatabaseManager {
    pub fn new<P: AsRef<Path>>(path: P) -> Result<Self> {
        let conn = Connection::open(path)?;

        conn.execute("PRAGMA foreign_keys = ON;", [])?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                title TEXT,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS session_history (
                session_id TEXT PRIMARY KEY,
                history_json TEXT NOT NULL,
                FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
            )",
            [],
        )?;

        Ok(Self {
            conn: Mutex::new(conn),
        })
    }
}
