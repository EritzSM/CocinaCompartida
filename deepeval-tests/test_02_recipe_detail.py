"""
F2 — Recipe Detail: Pruebas DeepEval para ingredientes, pasos y autor

Métricas aplicadas:
  - FaithfulnessMetric    : los pasos son fieles al contexto de los ingredientes (RAG)
  - AnswerRelevancyMetric : la descripción es relevante para el nombre de la receta
  - ToxicityMetric        : descripción e ingredientes sin contenido tóxico
"""

import pytest
from deepeval import assert_test
from deepeval.test_case import LLMTestCase
from deepeval.metrics import FaithfulnessMetric, AnswerRelevancyMetric, ToxicityMetric

from conftest import EVAL_MODEL, get_recipes, get_recipe, rate_limit_sleep


# ════════════════════════════════════════════════════════════════════════════
class TestRecipeDetailDeepEval:
    """F2 — Recipe Detail — Evaluación DeepEval con Groq"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Carga la primera receta con detalle completo."""
        recipes = get_recipes()
        assert len(recipes) > 0, "No hay recetas disponibles para evaluar"

        # Obtener detalle completo (incluye ingredientes y pasos)
        self.recipe = get_recipe(recipes[0]["id"])
        self.nombre      = self.recipe.get("name", "")
        self.descripcion = self.recipe.get("descripcion", self.nombre)
        self.ingredientes = self.recipe.get("ingredients", [])
        self.pasos        = self.recipe.get("steps", [])
        self.autor        = self.recipe.get("user", {}).get("username", "")

    # ── RAG: Faithfulness ────────────────────────────────────────────────────

    def test_recipe_steps_faithful_to_ingredients(self):
        """
        [RAG — Faithfulness] Los pasos de preparación deben ser coherentes con
        los ingredientes listados (retrieval context = ingredientes).

        Simula un caso RAG donde:
          retrieval_context = ingredientes (documentos recuperados)
          actual_output     = pasos de preparación (respuesta generada)
        """
        if not self.ingredientes or not self.pasos:
            pytest.skip("La receta no tiene ingredientes o pasos para evaluar RAG")

        retrieval_context = [
            f"Ingredientes de '{self.nombre}': {', '.join(self.ingredientes)}"
        ]
        actual_output = f"Pasos: {'; '.join(self.pasos)}"

        test_case = LLMTestCase(
            input=f"¿Cómo se prepara la receta '{self.nombre}'?",
            actual_output=actual_output,
            retrieval_context=retrieval_context,
        )

        metric = FaithfulnessMetric(
            threshold=0.4,
            model=EVAL_MODEL,
            include_reason=True,
        )

        rate_limit_sleep(5)
        assert_test(test_case, [metric])

    # ── Corrección: AnswerRelevancy ──────────────────────────────────────────

    def test_recipe_description_relevant_to_name(self):
        """
        [Corrección] La descripción de la receta debe ser relevante respecto
        a su nombre (la descripción tiene sentido para esa receta).
        """
        test_case = LLMTestCase(
            input=f"Descripción de la receta llamada '{self.nombre}'",
            actual_output=self.descripcion,
            expected_output=(
                f"Una descripción culinaria coherente con el nombre '{self.nombre}', "
                "explicando qué tipo de plato es"
            ),
        )

        metric = AnswerRelevancyMetric(
            threshold=0.4,
            model=EVAL_MODEL,
            include_reason=True,
        )

        rate_limit_sleep(4)
        assert_test(test_case, [metric])

    # ── Toxicidad ────────────────────────────────────────────────────────────

    def test_recipe_detail_content_not_toxic(self):
        """
        [Toxicidad] El contenido completo del detalle de receta
        (nombre + descripción) no debe contener contenido tóxico.
        """
        contenido = f"Receta: {self.nombre}. {self.descripcion}"

        test_case = LLMTestCase(
            input="Contenido de detalle de una receta de cocina",
            actual_output=contenido,
        )

        metric = ToxicityMetric(
            threshold=0.5,
            model=EVAL_MODEL,
            include_reason=True,
        )

        rate_limit_sleep(4)
        assert_test(test_case, [metric])

    def test_recipe_ingredients_not_toxic(self):
        """
        [Toxicidad] La lista de ingredientes de la receta debe ser apropiada.
        """
        if not self.ingredientes:
            pytest.skip("La receta no tiene ingredientes listados")

        ingredientes_str = ", ".join(self.ingredientes[:5])  # máximo 5 para eficiencia

        test_case = LLMTestCase(
            input="Lista de ingredientes de una receta de cocina",
            actual_output=ingredientes_str,
        )

        metric = ToxicityMetric(
            threshold=0.5,
            model=EVAL_MODEL,
            include_reason=True,
        )

        rate_limit_sleep(4)
        assert_test(test_case, [metric])
