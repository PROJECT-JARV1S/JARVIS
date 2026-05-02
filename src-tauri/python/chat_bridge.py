"""Bridge between Tauri (Rust/PyO3) and the jarvis-chat Python library."""

def send_prompt(message: str, provider: str = "default") -> str:
    """Send a prompt to jarvis-chat and return the response.
    
    Called from Rust via PyO3.
    """
    # TODO: Import and call jarvis-chat once the library API is finalized
    # from jarvis_chat import ChatClient
    # client = ChatClient(provider=provider)
    # return client.send(message)
    return f"[jarvis-chat stub] Received: {message}"
    
def get_available_providers() -> list[str]:
    """Return list of configured LLM providers."""
    # TODO: Query jarvis-chat for available providers
    return ["stub-provider"]
