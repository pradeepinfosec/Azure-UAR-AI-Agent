"""
groq_client.py — Raw Python requests wrapper for Groq LLM API integration.
"""

import os
import requests
from typing import Dict, Any, List

class GroqClient:
    def __init__(self, api_key: str = None, model: str = "llama-3.3-70b-versatile"):
        self.api_key = api_key or os.getenv("GROQ_API_KEY", "")
        self.model = model
        self.endpoint = "https://api.groq.com/openai/v1/chat/completions"

    def chat_completion(self, system_prompt: str, user_prompt: str) -> str:
        """Sends chat completion request directly to Groq API using standard Python requests."""
        if not self.api_key:
            return "Mock Groq Response: API key not set."

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.1,
            "response_format": {"type": "json_object"}
        }

        try:
            response = requests.post(self.endpoint, headers=headers, json=payload, timeout=30)
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"[GroqClient Error] {e}")
            raise e
