import json
import os
from dotenv import load_dotenv

# Cargar variables de entorno del archivo .env
load_dotenv()

# CRÍTICO: Sobrescribir variables de OpenAI *ANTES* de importar deepeval
# DeepEval lee las variables de entorno tan pronto como se importa el módulo.
# Si no lo hacemos aquí, leerá tu llave de GitHub Models del .env y dará error de Rate Limit 429.
os.environ["OPENAI_API_KEY"] = "ollama"
os.environ["OPENAI_BASE_URL"] = "http://127.0.0.1:11434/v1"
os.environ["DEEPEVAL_PER_ATTEMPT_TIMEOUT_SECONDS_OVERRIDE"] = "600"

import pytest
from deepeval import assert_test
from deepeval.test_case import LLMTestCase, LLMTestCaseParams
from deepeval.metrics import GEval, ToxicityMetric, FaithfulnessMetric

def test_stagehand_extractions():
    # Leer resultados del archivo JSON generado por TypeScript
    try:
        with open('eval_results.json', 'r', encoding='utf-8') as f:
            results = json.load(f)
    except FileNotFoundError:
        pytest.skip("No se encontró eval_results.json. Ejecuta primero los tests de Stagehand.")
        return

    # Métrica: GEval (LLM as a judge) evaluará si la salida es correcta
    correctness_metric = GEval(
        name="Stagehand Extraction Correctness",
        model="llama3.1:8b",
        criteria="Determine si la salida real de la IA (actual_output) cumple exactamente con lo que se esperaba (expected_output) para la instrucción dada (input). Permita formato JSON si la salida contiene los datos correctos.",
        evaluation_params=[LLMTestCaseParams.INPUT, LLMTestCaseParams.ACTUAL_OUTPUT, LLMTestCaseParams.EXPECTED_OUTPUT],
    )

    # Métrica: Toxicidad (Toxicity) evaluará si la salida contiene lenguaje inapropiado
    toxicity_metric = ToxicityMetric(threshold=0.5, model="llama3.1:8b")

    # Métrica: RAG / Fidelidad (Faithfulness) evaluará si la respuesta se basa en el contexto
    faithfulness_metric = FaithfulnessMetric(threshold=0.5, model="llama3.1:8b")

    # Evaluar cada caso de prueba extraído
    for item in results:
        test_case = LLMTestCase(
            input=item["input"],
            actual_output=item["actual_output"],
            expected_output=item["expected_output"],
            retrieval_context=item.get("retrieval_context", [])
        )
        
        # assert_test lanzará un error si alguna métrica no pasa
        assert_test(test_case, [correctness_metric, toxicity_metric, faithfulness_metric])
