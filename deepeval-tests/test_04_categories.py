"""
F4 — Categories/Tags: Pruebas DeepEval para el sistema de categorías

Métricas aplicadas:
  - AnswerRelevancyMetric : las recetas de una categoría son relevantes para esa categoría
  - FaithfulnessMetric    : el filtrado devuelve recetas coherentes con la categoría (RAG)
  - ToxicityMetric        : los nombres de las categorías son apropiados
"""

import pytest
from deepeval import assert_test
from deepeval.test_case import LLMTestCase
from deepeval.metrics import AnswerRelevancyMetric, FaithfulnessMetric, ToxicityMetric

from conftest import EVAL_MODEL, get_recipes, rate_limit_sleep


# ════════════════════════════════════════════════════════════════════════════
class TestCategoriesDeepEval:
    """F4 — Categories/Tags — Evaluación DeepEval con Groq"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Carga recetas y extrae categorías únicas."""
        self.all_recipes = get_recipes()
        assert len(self.all_recipes) > 0, "No hay recetas para evaluar categorías"

        # Agrupar recetas por categoría
        self.by_category: dict[str, list[dict]] = {}
        for r in self.all_recipes:
            cat = r.get("category")
            if cat:
                self.by_category.setdefault(cat, []).append(r)

        self.categories = list(self.by_category.keys())

    # ── Corrección: recetas en categoría son relevantes ──────────────────────

    def test_category_recipes_are_relevant_to_category(self):
        """
        [Corrección] Las recetas agrupadas bajo una categoría son relevantes
        para esa categoría culinaria.
        """
        if not self.categories:
            pytest.skip("No hay categorías con recetas para evaluar")

        # Evaluar la primera categoría disponible
        cat = self.categories[0]
        recetas = self.by_category[cat][:2]  # máximo 2 recetas por eficiencia

        nombres = ", ".join(r["name"] for r in recetas)

        test_case = LLMTestCase(
            input=f"Recetas filtradas por categoría '{cat}' en CocinaCompartida",
            actual_output=f"Las recetas en la categoría '{cat}' son: {nombres}",
            expected_output=(
                f"Una lista de recetas culinarias cuyo tipo o estilo corresponde "
                f"a la categoría '{cat}'"
            ),
        )

        metric = AnswerRelevancyMetric(
            threshold=0.4,
            model=EVAL_MODEL,
            include_reason=True,
        )

        rate_limit_sleep(5)
        assert_test(test_case, [metric])

    # ── RAG: coherencia del filtrado por categoría ───────────────────────────

    def test_category_filter_faithful_to_request(self):
        """
        [RAG — Faithfulness] El resultado del filtro por categoría es fiel
        a la solicitud de filtrado (solo devuelve recetas de esa categoría).

        retrieval_context = categoría solicitada (parámetro del filtro)
        actual_output     = lista de recetas devueltas por el filtro
        """
        if len(self.categories) < 1:
            pytest.skip("Sin categorías para evaluar RAG")

        cat = self.categories[0]
        recetas_cat = self.by_category[cat][:3]

        # Verificar que los nombres son coherentes con la categoría
        nombres_devueltos = [r["name"] for r in recetas_cat]

        test_case = LLMTestCase(
            input=f"Filtrar recetas de la categoría '{cat}'",
            actual_output=f"Recetas devueltas: {', '.join(nombres_devueltos)}",
            retrieval_context=[
                f"El sistema debe mostrar solo recetas cuya categoría es '{cat}'. "
                f"Total de recetas en esta categoría: {len(recetas_cat)}."
            ],
        )

        metric = FaithfulnessMetric(
            threshold=0.4,
            model=EVAL_MODEL,
            include_reason=True,
        )

        rate_limit_sleep(5)
        assert_test(test_case, [metric])

    # ── Toxicidad: nombres de categorías ─────────────────────────────────────

    def test_category_names_not_toxic(self):
        """
        [Toxicidad] Los nombres de las categorías culinarias disponibles
        no contienen contenido inapropiado.
        """
        if not self.categories:
            pytest.skip("No hay categorías disponibles")

        categorias_str = ", ".join(self.categories)

        test_case = LLMTestCase(
            input="Nombres de categorías de recetas en una plataforma culinaria",
            actual_output=f"Categorías disponibles: {categorias_str}",
        )

        metric = ToxicityMetric(
            threshold=0.5,
            model=EVAL_MODEL,
            include_reason=True,
        )

        rate_limit_sleep(4)
        assert_test(test_case, [metric])

    def test_multiple_categories_are_distinct_and_relevant(self):
        """
        [Corrección] Si hay más de una categoría, cada una debe ser
        un término culinario distinto y apropiado.
        """
        if len(self.categories) < 2:
            pytest.skip("Solo hay una categoría — test de múltiples no aplica")

        # Tomar las primeras 4 categorías como máximo
        cats_sample = self.categories[:4]
        cats_str = ", ".join(cats_sample)

        test_case = LLMTestCase(
            input="Sistema de categorías de una aplicación de recetas de cocina",
            actual_output=f"El sistema tiene las siguientes categorías: {cats_str}",
            expected_output=(
                "Un conjunto de categorías culinarias distintas entre sí, como postres, "
                "ensaladas, carnes, pastas, sopas u otras categorías de comida"
            ),
        )

        metric = AnswerRelevancyMetric(
            threshold=0.4,
            model=EVAL_MODEL,
            include_reason=True,
        )

        rate_limit_sleep(4)
        assert_test(test_case, [metric])
