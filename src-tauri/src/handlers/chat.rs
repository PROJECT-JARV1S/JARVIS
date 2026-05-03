use crate::domain::chat::ChatState;
use crate::domain::errors::AppError;
use pyo3::prelude::*;
use pyo3::types::PyList;

pub fn send_prompt(input: &str, provider: &str) -> Result<String, AppError> {
    Python::attach(|py| -> PyResult<String> {
        let bridge = PyModule::import(py, "chat_bridge")?;
        let result = bridge.call_method1("send_prompt", (input, provider))?;
        result.extract::<String>()
    })
    .map_err(|e| AppError::PythonError(e.to_string()))
}

pub fn get_providers() -> Result<Vec<String>, AppError> {
    Python::attach(|py| -> PyResult<Vec<String>> {
        let bridge = PyModule::import(py, "chat_bridge")?;
        let result = bridge.call_method0("get_available_providers")?;
        let py_list: &Bound<'_, PyList> = result.cast()?;
        py_list
            .iter()
            .map(|item: Bound<'_, pyo3::PyAny>| item.extract::<String>())
            .collect()
    })
    .map_err(|e| AppError::PythonError(e.to_string()))
}

pub fn set_provider(state: &ChatState, provider: String) -> Result<(), AppError> {
    let mut active = state
        .active_provider
        .lock()
        .map_err(|e| AppError::LockError(e.to_string()))?;
    *active = provider;
    Ok(())
}
