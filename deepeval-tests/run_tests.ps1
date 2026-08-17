# run_tests.ps1
# Ejecuta la suite completa de DeepEval para CocinaCompartida
# Requiere: Python 3.12+ y las dependencias en requirements.txt
#
# Uso:
#   cd deepeval-tests
#   pip install -r requirements.txt
#   .\run_tests.ps1

$root = $PSScriptRoot
Set-Location $root

Write-Host ""
Write-Host "══════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "   DeepEval + Groq — CocinaCompartida" -ForegroundColor Magenta
Write-Host "   Corrección | RAG | Toxicidad" -ForegroundColor Magenta
Write-Host "══════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host ""

# Verificar Python
$pyVersion = python --version 2>&1
Write-Host "Python: $pyVersion" -ForegroundColor Cyan

# Instalar dependencias si no están presentes
Write-Host "Instalando dependencias..." -ForegroundColor Yellow
pip install -r requirements.txt -q

Write-Host ""
Write-Host "Ejecutando tests por funcionalidad (pausa entre grupos para Groq rate limit)..." -ForegroundColor Cyan
Write-Host ""

$files = @(
  @{ name = "F1 — Explore";         file = "test_01_explore.py" }
  @{ name = "F2 — Recipe Detail";   file = "test_02_recipe_detail.py" }
  @{ name = "F3 — Backend CRUD";    file = "test_03_backend_crud.py" }
  @{ name = "F4 — Categories/Tags"; file = "test_04_categories.py" }
  @{ name = "F5 — Favorites";       file = "test_05_favorites.py" }
)

$results = @()
$wait = 30  # segundos entre grupos para respetar rate limit de Groq

for ($i = 0; $i -lt $files.Length; $i++) {
  $f = $files[$i]
  Write-Host "─────────────────────────────────────────" -ForegroundColor Cyan
  Write-Host "[$($i+1)/$($files.Length)] $($f.name)" -ForegroundColor Cyan
  Write-Host "─────────────────────────────────────────" -ForegroundColor Cyan

  $start = Get-Date
  python -m pytest $f.file -v --tb=short 2>&1
  $exit = $LASTEXITCODE
  $elapsed = [int]((Get-Date) - $start).TotalSeconds

  if ($exit -eq 0) {
    $results += "✅ $($f.name) (${elapsed}s)"
    Write-Host "PASSED en ${elapsed}s" -ForegroundColor Green
  } else {
    $results += "❌ $($f.name) (exit $exit, ${elapsed}s)"
    Write-Host "FAILED (exit $exit)" -ForegroundColor Red
  }

  if ($i -lt $files.Length - 1) {
    Write-Host "Esperando ${wait}s (rate limit Groq)..." -ForegroundColor Yellow
    Start-Sleep -Seconds $wait
  }
}

Write-Host ""
Write-Host "══════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "          RESUMEN DEEPEVAL" -ForegroundColor Magenta
Write-Host "══════════════════════════════════════════════" -ForegroundColor Magenta
foreach ($r in $results) {
  $color = if ($r.StartsWith("✅")) { "Green" } else { "Red" }
  Write-Host $r -ForegroundColor $color
}
Write-Host "══════════════════════════════════════════════" -ForegroundColor Magenta
