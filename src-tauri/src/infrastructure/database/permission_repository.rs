use crate::domain::errors::AppError;
use crate::domain::permission::PermissionPreference;
use crate::infrastructure::database::models::schema::permission_preferences::dsl as prefs;
use crate::infrastructure::database::pool::DbPool;
use diesel::prelude::*;
use diesel_async::RunQueryDsl;

pub struct PermissionRepository {
    pool: DbPool,
}

impl PermissionRepository {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    pub async fn get_preference(&self, name: &str) -> Result<Option<String>, AppError> {
        let mut conn = self.pool.get().await?;
        let result = prefs::permission_preferences
            .filter(prefs::tool_name.eq(name))
            .select(prefs::decision)
            .first::<String>(&mut conn)
            .await
            .optional()?;
        Ok(result)
    }

    pub async fn set_preference(&self, name: &str, decision_val: &str) -> Result<(), AppError> {
        let mut conn = self.pool.get().await?;
        diesel::insert_into(prefs::permission_preferences)
            .values((prefs::tool_name.eq(name), prefs::decision.eq(decision_val)))
            .on_conflict(prefs::tool_name)
            .do_update()
            .set(prefs::decision.eq(decision_val))
            .execute(&mut conn)
            .await?;
        Ok(())
    }

    pub async fn list_preferences(&self) -> Result<Vec<PermissionPreference>, AppError> {
        let mut conn = self.pool.get().await?;
        let rows = prefs::permission_preferences
            .select((prefs::tool_name, prefs::decision))
            .load::<(String, String)>(&mut conn)
            .await?;
        Ok(rows
            .into_iter()
            .map(|(t, d)| PermissionPreference {
                tool_name: t,
                decision: d,
            })
            .collect())
    }

    pub async fn delete_preference(&self, name: &str) -> Result<(), AppError> {
        let mut conn = self.pool.get().await?;
        diesel::delete(prefs::permission_preferences.filter(prefs::tool_name.eq(name)))
            .execute(&mut conn)
            .await?;
        Ok(())
    }
}
