"""
F1 — Explore: Pruebas DeepEval para el motor de búsqueda y navegación

Métricas aplicadas:
  - AnswerRelevancyMetric : las recetas devueltas son relevantes como contenido culinario
  - ToxicityMetric        : los nombres/descripciones no contienen contenido tóxico
"""

import pytest
from deepeval import assert_test
from deepeval.test_case import LLMTestCase
from deepeval.metrics import AnswerRelevancyMetric, ToxicityMetric

from conftest import EVAL_MODEL, get_recipes, rate_limit_sleep


# ════════════════════════════════════════════════════════════════════════════
class TestExploreDeepEval:
    """F1 — Explore: Motor de búsqueda — Evaluación con DeepEval + Groq"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Carga las recetas una sola vez para todos los tests del grupo."""
        self.recipes = get_recipes()
        assert len(self.recipes) > 0, "La API no devolvió recetas para evaluar"
        self.first = self.recipes[0]

    # ── AnswerRelevancy ──────────────────────────────────────────────────────

    def test_explore_recipe_is_culinary_content(self):
        """
        [Corrección] Verifica que la primera receta del feed es contenido culinario relevante.

        Input:    Contexto — búsqueda de recetas de cocina
        Output:   Nombre + descripción de la primera receta
        Expected: Descripción coherente con una receta de cocina
        """
        nombre     = self.first.get("name", "")
        descripcion = self.first.get("descripcion", nombre)

        test_case = LLMTestCase(
            input="Buscar recetas de cocina en la plataforma CocinaCompartida",
            actual_output=f"Receta encontrada: '{nombre}'. Descripción: {descripcion}",
            expected_output=(
                "Una receta de cocina con nombre, descripción de ingredientes "
                "y método de preparación"
            ),
        )

        metric = AnswerRelevancyMetric(
            threshold=0.4,
            model=EVAL_MODEL,
            include_reason=True,
        )

        rate_limit_sleep(3)
        assert_test(test_case, [metric])

    # ── Toxicity ─────────────────────────────────────────────────────────────

    def test_explore_recipe_names_not_toxic(self):
        """
        [Toxicidad] Verifica que los nombres de las recetas no contienen contenido tóxico.

        Evalúa hasta 3 recetas del feed para eficiencia con el rate limit.
        """
        recipes_to_check = self.recipes[:3]

        for recipe in recipes_to_check:
            nombre = recipe.get("name", "")

            test_case = LLMTestCase(
                input="Nombre de una receta de cocina publicada en una plataforma",
                actual_output=nombre,
            )

            metric = ToxicityMetric(
                threshold=0.5,
                model=EVAL_MODEL,
                include_reason=True,
            )

            rate_limit_sleep(4)
            assert_test(test_case, [metric])

    def test_explore_recipe_descriptions_not_toxic(self):
        """
        [Toxicidad] Verifica que las descripciones de las recetas son apropiadas.
        """
        recipes_to_check = [r for r in self.recipes[:2] if r.get("descripcion")]

        if not recipes_to_check:
            pytest.skip("No hay recetas con descripción para evaluar")

        recipe = recipes_to_check[0]
        descripcion = recipe.get("descripcion", "")

        test_case = LLMTestCase(
            input="Descripción de una receta de cocina en una plataforma culinaria",
            actual_output=descripcion,
        )

        metric = ToxicityMetric(
            threshold=0.5,
            model=EVAL_MODEL,
            include_reason=True,
        )

        rate_limit_sleep(4)
        assert_test(test_case, [metric])
