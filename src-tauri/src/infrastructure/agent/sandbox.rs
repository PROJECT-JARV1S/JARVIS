use crate::domain::config::AppConfig;
use crate::domain::errors::AppError;
use agent_rs_lib::security::{SandboxConfig, SharedSandbox};
use std::sync::{Arc, OnceLock};

/// Global shared sandbox that persists across agent rebuilds and supports hot-swapping.
pub(crate) static SHARED_SANDBOX: OnceLock<Arc<SharedSandbox>> = OnceLock::new();

/// Returns the global `Arc<SharedSandbox>`, if initialized.
///
/// Returns `None` if no agent has been built yet (i.e. the lazy initializer hasn't fired).
pub fn try_get_shared_sandbox() -> Option<Arc<SharedSandbox>> {
    SHARED_SANDBOX.get().cloned()
}

/// Returns the global `Arc<SharedSandbox>`, initializing it on first call.
///
/// # Panics
///
/// Panics if the initial `sandbox_dir` cannot be canonicalized.
#[allow(clippy::expect_used)]
pub(crate) fn get_or_init_shared_sandbox(config: &AppConfig) -> Arc<SharedSandbox> {
    SHARED_SANDBOX
        .get_or_init(|| {
            let sc =
                SandboxConfig::single(&config.sandbox_dir).expect("Initial sandbox_dir is invalid");
            Arc::new(SharedSandbox::from(sc))
        })
        .clone()
}

/// Hot-swaps the sandbox root if `sandbox_dir` has changed, without rebuilding the agent.
pub(crate) fn hot_swap_sandbox(config: &AppConfig) -> Result<(), AppError> {
    if let Some(shared) = SHARED_SANDBOX.get() {
        let new_config = SandboxConfig::single(&config.sandbox_dir)
            .map_err(|e| AppError::SystemError(e.to_string()))?;
        shared
            .set(new_config)
            .map_err(|e| AppError::SystemError(e.to_string()))?;
    }
    Ok(())
}
