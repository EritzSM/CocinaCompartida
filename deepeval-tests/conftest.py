"""
conftest.py — Configuración global de DeepEval para CocinaCompartida

Usa Groq (llama-3.3-70b-versatile) como modelo evaluador vía DeepEvalBaseLLM
personalizado, ya que DeepEval 4.x no reconoce el prefijo "groq/" automáticamente.

Las métricas disponibles son:
  - AnswerRelevancyMetric  (corrección / relevancia)
  - FaithfulnessMetric     (RAG fidelidad)
  - ToxicityMetric         (toxicidad)
"""

import os
import time
import requests
import pytest
from pathlib import Path
from dotenv import load_dotenv
from deepeval.models.base_model import DeepEvalBaseLLM

# ── Cargar variables de entorno ──────────────────────────────────────────────
env_path = Path(__file__).parent.parent / "cocina-compartida" / "stagehand" / ".env"
load_dotenv(env_path)

# ── Configuración del modelo evaluador ──────────────────────────────────────
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY no encontrada en stagehand/.env")

os.environ["GROQ_API_KEY"] = GROQ_API_KEY

# ── Configuración de la aplicación a evaluar ─────────────────────────────────
BASE_URL = os.getenv("FRONTEND_URL", os.getenv("BASE_URL", "http://localhost"))
API_URL  = f"{BASE_URL}/api"


# ════════════════════════════════════════════════════════════════════════════
class GroqDeepEvalModel(DeepEvalBaseLLM):
    """
    Adaptador de Groq para DeepEval.
    Implementa DeepEvalBaseLLM para que las métricas de DeepEval puedan
    usar el LLM de Groq (llama-3.3-70b-versatile) en lugar de OpenAI.
    """

    def __init__(self, model_name: str = "llama-3.3-70b-versatile"):
        self.model_name = model_name
        self._request_count = 0
        from groq import Groq as _Groq
        self._client = _Groq(api_key=GROQ_API_KEY)

    def load_model(self):
        return self._client

    def generate(self, prompt: str, schema=None) -> str:
        """Genera texto usando Groq; incluye delay para respetar rate limit (30 RPM)."""
        self._request_count += 1
        if self._request_count > 1:
            time.sleep(3)   # ~20 RPM efectivos — dentro del límite gratuito

        response = self._client.chat.completions.create(
            model=self.model_name,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=512,
            temperature=0.0,
        )
        return response.choices[0].message.content

    async def a_generate(self, prompt: str, schema=None) -> str:
        """Versión async — delega al método sync."""
        return self.generate(prompt, schema)

    def get_model_name(self) -> str:
        return f"groq/{self.model_name}"


# Instancia global reutilizable (evita crear múltiples clientes)
GROQ_EVAL_MODEL = GroqDeepEvalModel()

# Alias para retrocompatibilidad con tests que importen EVAL_MODEL
EVAL_MODEL = GROQ_EVAL_MODEL


# ── Fixtures pytest ───────────────────────────────────────────────────────────
@pytest.fixture(scope="session")
def groq_model() -> GroqDeepEvalModel:
    """Fixture de sesión que devuelve el modelo Groq para DeepEval."""
    return GROQ_EVAL_MODEL


# ── Helpers de API ───────────────────────────────────────────────────────────

def login() -> str:
    """Login real con las credenciales del seeder → retorna JWT."""
    resp = requests.post(
        f"{API_URL}/auth/login",
        json={
            "email":    os.getenv("TEST_EMAIL",    "chef@cocinacompartida.com"),
            "password": os.getenv("TEST_PASSWORD", "password123"),
        },
        timeout=10,
    )
    resp.raise_for_status()
    data = resp.json()
    token = data.get("token") or data.get("access_token")
    assert token, f"No se encontró token en respuesta: {data}"
    return token


def get_recipes(token: str | None = None) -> list[dict]:
    """Obtiene la lista de recetas desde la API."""
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    resp = requests.get(f"{API_URL}/recipes", headers=headers, timeout=10)
    resp.raise_for_status()
    return resp.json()


def get_recipe(recipe_id: str, token: str | None = None) -> dict:
    """Obtiene el detalle de una receta."""
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    resp = requests.get(f"{API_URL}/recipes/{recipe_id}", headers=headers, timeout=10)
    resp.raise_for_status()
    return resp.json()


def rate_limit_sleep(seconds: float = 5.0):
    """Pausa entre evaluaciones para respetar el rate limit de Groq (8K TPM)."""
    time.sleep(seconds)
