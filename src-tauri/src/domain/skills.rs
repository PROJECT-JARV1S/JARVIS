use serde::Serialize;

#[derive(Serialize)]
pub struct SkillResult {
    pub skill_name: String,
    pub success: bool,
    pub message: String,
}
