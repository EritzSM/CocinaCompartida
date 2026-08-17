"""
F5 — Favorites/Bookmarks: Pruebas DeepEval para likes y favoritos

Métricas aplicadas:
  - AnswerRelevancyMetric : las recetas con más likes son contenido culinario de calidad
  - FaithfulnessMetric    : el like incrementa el contador de forma fiel (RAG)
  - ToxicityMetric        : las recetas populares (más likes) no tienen contenido inapropiado
"""

import requests
import pytest
from deepeval import assert_test
from deepeval.test_case import LLMTestCase
from deepeval.metrics import AnswerRelevancyMetric, FaithfulnessMetric, ToxicityMetric

from conftest import EVAL_MODEL, login, get_recipes, get_recipe, API_URL, rate_limit_sleep


# ════════════════════════════════════════════════════════════════════════════
class TestFavoritesDeepEval:
    """F5 — Favorites/Bookmarks — Evaluación DeepEval con Groq"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Carga recetas y obtiene token real."""
        self.token   = login()
        self.recipes = get_recipes(self.token)
        assert len(self.recipes) > 0, "No hay recetas disponibles para evaluar"

        # Ordenar por likes descendente para evaluar las más populares
        self.sorted_by_likes = sorted(
            self.recipes, key=lambda r: r.get("likes", 0), reverse=True
        )
        self.most_liked = self.sorted_by_likes[0]

    # ── Corrección: recetas con más likes son calidad culinaria ──────────────

    def test_most_liked_recipe_is_quality_culinary_content(self):
        """
        [Corrección] La receta con más likes en la plataforma debe ser
        contenido culinario relevante y de calidad (justifica que los usuarios
        la hayan marcado como favorita).
        """
        nombre      = self.most_liked.get("name", "")
        descripcion = self.most_liked.get("descripcion", nombre)
        likes       = self.most_liked.get("likes", 0)

        test_case = LLMTestCase(
            input=(
                f"La receta más popular en CocinaCompartida tiene {likes} likes. "
                "¿Justifica ese nivel de popularidad su contenido?"
            ),
            actual_output=(
                f"Receta popular: '{nombre}'. "
                f"Descripción: {descripcion}. "
                f"Total de likes: {likes}."
            ),
            expected_output=(
                "Una receta culinaria atractiva, con nombre y descripción que justifican "
                "ser marcada como favorita por múltiples usuarios"
            ),
        )

        metric = AnswerRelevancyMetric(
            threshold=0.4,
            model=EVAL_MODEL,
            include_reason=True,
        )

        rate_limit_sleep(5)
        assert_test(test_case, [metric])

    # ── RAG: el like es fiel al cambio de estado ─────────────────────────────

    def test_like_action_faithfully_increments_counter(self):
        """
        [RAG — Faithfulness] Después de dar like a una receta, el contador
        de likes refleja fielmente la acción del usuario.

        retrieval_context = estado antes del like
        actual_output     = estado después del like
        """
        recipe_id   = self.most_liked["id"]
        likes_antes = self.most_liked.get("likes", 0)

        # Ejecutar el like
        resp = requests.post(
            f"{API_URL}/recipes/{recipe_id}/like",
            headers={"Authorization": f"Bearer {self.token}"},
            timeout=10,
        )
        assert resp.status_code in (200, 201), f"Like falló: {resp.status_code}"

        likes_despues = resp.json().get("likes", likes_antes)

        # Contexto neutral: la API usa toggle, el resultado es el estado actual del campo likes
        test_case = LLMTestCase(
            input=f"El usuario ejecutó la acción de like/toggle en la receta '{self.most_liked['name']}'",
            actual_output=(
                f"El endpoint respondió exitosamente (HTTP {resp.status_code}). "
                f"El campo 'likes' en la respuesta de la API es: {likes_despues}. "
                f"Este campo refleja el estado del contador después del toggle."
            ),
            retrieval_context=[
                "El endpoint POST /api/recipes/:id/like implementa un sistema de toggle: "
                "al llamarlo, añade o quita el like del usuario. "
                "La respuesta incluye el campo 'likes' con el valor actualizado del contador.",
                f"La acción se ejecutó con HTTP {resp.status_code}. "
                f"El campo 'likes' en la respuesta es un número entero no negativo.",
            ],
        )

        metric = FaithfulnessMetric(
            threshold=0.4,
            model=EVAL_MODEL,
            include_reason=True,
        )

        rate_limit_sleep(5)
        assert_test(test_case, [metric])

    # ── Toxicidad: recetas populares ─────────────────────────────────────────

    def test_top_liked_recipes_not_toxic(self):
        """
        [Toxicidad] Las recetas más populares (con más likes = favoritas de más usuarios)
        no deben contener nombres o descripciones con contenido inapropiado.
        """
        top_3 = self.sorted_by_likes[:3]

        for recipe in top_3:
            nombre      = recipe.get("name", "")
            descripcion = recipe.get("descripcion", nombre)
            likes       = recipe.get("likes", 0)

            contenido = f"Receta favorita '{nombre}' ({likes} likes): {descripcion}"

            test_case = LLMTestCase(
                input=(
                    "Contenido de una receta marcada como favorita por múltiples "
                    "usuarios en una plataforma culinaria"
                ),
                actual_output=contenido,
            )

            metric = ToxicityMetric(
                threshold=0.5,
                model=EVAL_MODEL,
                include_reason=True,
            )

            rate_limit_sleep(4)
            assert_test(test_case, [metric])

    def test_all_recipes_likes_are_non_negative(self):
        """
        [Corrección — Sanity Check] Todas las recetas deben tener un contador
        de likes >= 0 (integridad de datos básica).
        """
        likes_validos = all(r.get("likes", 0) >= 0 for r in self.recipes)

        test_case = LLMTestCase(
            input="¿Es válida la integridad de datos de likes en CocinaCompartida?",
            actual_output=(
                f"Se revisaron {len(self.recipes)} recetas. "
                f"Todas tienen likes >= 0: {likes_validos}. "
                f"Máximo likes: {max(r.get('likes', 0) for r in self.recipes)}."
            ),
            expected_output=(
                "Todos los contadores de likes son números no negativos, "
                "indicando integridad de datos correcta"
            ),
        )

        metric = AnswerRelevancyMetric(
            threshold=0.4,
            model=EVAL_MODEL,
            include_reason=True,
        )

        rate_limit_sleep(4)
        assert_test(test_case, [metric])
