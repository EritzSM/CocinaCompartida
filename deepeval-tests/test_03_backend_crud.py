"""
F3 — Backend CRUD: Pruebas DeepEval para Create, Read, Update, Delete

Métricas aplicadas:
  - AnswerRelevancyMetric : la receta creada por CRUD corresponde a una receta válida
  - FaithfulnessMetric    : el resultado del UPDATE es fiel a los datos enviados (RAG)
  - ToxicityMetric        : datos creados/actualizados no tienen contenido tóxico
"""

import time
import requests
import pytest
from deepeval import assert_test
from deepeval.test_case import LLMTestCase
from deepeval.metrics import AnswerRelevancyMetric, FaithfulnessMetric, ToxicityMetric

from conftest import EVAL_MODEL, login, get_recipe, API_URL, rate_limit_sleep


TS            = int(time.time())
RECIPE_NAME   = f"DEEPEVAL_CRUD_{TS}"
RECIPE_EDIT   = f"DEEPEVAL_EDITADA_{TS}"


# ── Helper ───────────────────────────────────────────────────────────────────

def create_recipe(token: str) -> str:
    """Crea una receta de prueba y retorna su id."""
    resp = requests.post(
        f"{API_URL}/recipes",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name":        RECIPE_NAME,
            "descripcion": "Receta de prueba creada por DeepEval test suite",
            "ingredients": ["ingrediente uno 100g", "ingrediente dos 50g"],
            "steps":       ["Paso uno: preparar", "Paso dos: cocinar", "Paso tres: servir"],
            "category":    "postres",
            "images":      [],
        },
        timeout=10,
    )
    assert resp.status_code in (200, 201), f"CREATE falló: {resp.status_code} {resp.text}"
    return resp.json()["id"]


def delete_recipe(recipe_id: str, token: str):
    """Elimina la receta de prueba."""
    requests.delete(
        f"{API_URL}/recipes/{recipe_id}",
        headers={"Authorization": f"Bearer {token}"},
        timeout=10,
    )


# ════════════════════════════════════════════════════════════════════════════
class TestBackendCRUDDeepEval:
    """F3 — Backend CRUD — Evaluación DeepEval con Groq"""

    @pytest.fixture(autouse=True)
    def setup_teardown(self):
        """Login, crear receta de prueba, luego eliminarla."""
        self.token = login()
        self.recipe_id = create_recipe(self.token)
        yield
        delete_recipe(self.recipe_id, self.token)

    # ── Corrección: CREATE ───────────────────────────────────────────────────

    def test_crud_created_recipe_is_valid_culinary_content(self):
        """
        [Corrección] La receta creada vía API es contenido culinario válido
        (nombre y descripción coherentes con una receta de cocina real).
        """
        recipe = get_recipe(self.recipe_id)

        test_case = LLMTestCase(
            input="Receta creada mediante la API REST de CocinaCompartida",
            actual_output=(
                f"Nombre: {recipe['name']}. "
                f"Descripción: {recipe.get('descripcion', '')}. "
                f"Ingredientes: {', '.join(recipe.get('ingredients', []))}. "
                f"Pasos: {'; '.join(recipe.get('steps', []))}."
            ),
            expected_output=(
                "Una receta de cocina con nombre descriptivo, ingredientes en formato "
                "cantidad+producto y pasos de preparación numerados"
            ),
        )

        metric = AnswerRelevancyMetric(
            threshold=0.4,
            model=EVAL_MODEL,
            include_reason=True,
        )

        rate_limit_sleep(5)
        assert_test(test_case, [metric])

    # ── RAG: UPDATE es fiel al PATCH enviado ─────────────────────────────────

    def test_crud_update_faithfully_reflects_patch(self):
        """
        [RAG — Faithfulness] Después de un PATCH, la receta devuelve exactamente
        los datos actualizados (el UPDATE es fiel a la solicitud de cambio).

        retrieval_context = datos del PATCH enviado
        actual_output     = estado de la receta después del UPDATE
        """
        # Ejecutar el UPDATE
        resp = requests.patch(
            f"{API_URL}/recipes/{self.recipe_id}",
            headers={"Authorization": f"Bearer {self.token}"},
            json={"name": RECIPE_EDIT},
            timeout=10,
        )
        assert resp.status_code == 200, f"UPDATE falló: {resp.status_code}"

        # Leer el estado actualizado
        recipe = get_recipe(self.recipe_id)

        test_case = LLMTestCase(
            input=f"Actualización del nombre de la receta a '{RECIPE_EDIT}'",
            actual_output=f"El nombre actual de la receta es: '{recipe['name']}'",
            retrieval_context=[
                f"Se envió PATCH con nombre='{RECIPE_EDIT}' para la receta id={self.recipe_id}"
            ],
        )

        metric = FaithfulnessMetric(
            threshold=0.5,
            model=EVAL_MODEL,
            include_reason=True,
        )

        rate_limit_sleep(5)
        assert_test(test_case, [metric])

    # ── Toxicidad: datos CRUD ────────────────────────────────────────────────

    def test_crud_recipe_data_not_toxic(self):
        """
        [Toxicidad] Los datos de la receta creada y gestionada por CRUD
        no contienen contenido inapropiado.
        """
        recipe = get_recipe(self.recipe_id)
        contenido = (
            f"{recipe.get('name', '')} — "
            f"{recipe.get('descripcion', '')} — "
            f"Ingredientes: {', '.join(recipe.get('ingredients', []))}"
        )

        test_case = LLMTestCase(
            input="Datos de una receta gestionada mediante operaciones CRUD en la API",
            actual_output=contenido,
        )

        metric = ToxicityMetric(
            threshold=0.5,
            model=EVAL_MODEL,
            include_reason=True,
        )

        rate_limit_sleep(4)
        assert_test(test_case, [metric])
