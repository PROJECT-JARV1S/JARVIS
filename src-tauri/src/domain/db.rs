use rig::message::Message;
use rusqlite::{params, Connection, Result};
use serde::Serialize;
use std::path::Path;
use std::sync::Mutex;
use uuid::Uuid;

pub struct DatabaseManager {
    conn: Mutex<Connection>,
}

#[derive(Serialize)]
pub struct Session {
    pub id: String,
    pub title: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

impl DatabaseManager {
    pub fn new<P: AsRef<Path>>(path: P) -> Result<Self> {
        let conn = Connection::open(path)?;

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

    pub fn create_session(&self, title: Option<String>) -> Result<String> {
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp();

        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO sessions (id, title, created_at, updated_at) VALUES (?1, ?2, ?3, ?4)",
            params![id, title, now, now],
        )?;

        // Initialize empty history
        conn.execute(
            "INSERT INTO session_history (session_id, history_json) VALUES (?1, ?2)",
            params![id, "[]"],
        )?;

        Ok(id)
    }

    pub fn get_session_history(&self, session_id: &str) -> Result<Vec<Message>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt =
            conn.prepare("SELECT history_json FROM session_history WHERE session_id = ?1")?;

        let mut rows = stmt.query(params![session_id])?;
        if let Some(row) = rows.next()? {
            let history_json: String = row.get(0)?;
            let history: Vec<Message> = serde_json::from_str(&history_json)
                .map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;
            Ok(history)
        } else {
            Ok(Vec::new())
        }
    }

    pub fn save_session_history(&self, session_id: &str, history: &[Message]) -> Result<()> {
        let now = chrono::Utc::now().timestamp();
        let history_json = serde_json::to_string(history)
            .map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;

        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE session_history SET history_json = ?1 WHERE session_id = ?2",
            params![history_json, session_id],
        )?;

        conn.execute(
            "UPDATE sessions SET updated_at = ?1 WHERE id = ?2",
            params![now, session_id],
        )?;

        Ok(())
    }

    pub fn get_all_sessions(&self) -> Result<Vec<Session>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, title, created_at, updated_at FROM sessions ORDER BY updated_at DESC",
        )?;
        let session_iter = stmt.query_map([], |row| {
            Ok(Session {
                id: row.get(0)?,
                title: row.get(1)?,
                created_at: row.get(2)?,
                updated_at: row.get(3)?,
            })
        })?;

        let mut sessions = Vec::new();
        for session in session_iter {
            sessions.push(session?);
        }
        Ok(sessions)
    }
}
