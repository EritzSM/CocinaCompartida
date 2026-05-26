# Corre los 6 tests de Stagehand en orden, esperando 90s entre cada uno
# para respetar el limite de 8K tokens/min de Groq free tier.

$root = Split-Path $PSScriptRoot -Parent  # cocina-compartida/
Set-Location $root

$tests = @(
  @{ name = "observe-extract (demo)"; cmd = "stagehand:demo" }
  @{ name = "explore-search";         cmd = "stagehand:explore" }
  @{ name = "recipe-detail";          cmd = "stagehand:recipe-detail" }
  @{ name = "backend-crud";           cmd = "stagehand:backend-crud" }
  @{ name = "categories-tags";        cmd = "stagehand:categories" }
  @{ name = "favorites-bookmarks";    cmd = "stagehand:favorites" }
)

$results = @()
$wait = 90  # segundos entre tests

for ($i = 0; $i -lt $tests.Length; $i++) {
  $t = $tests[$i]
  Write-Host ""
  Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
  Write-Host "[$($i+1)/$($tests.Length)] $($t.name)" -ForegroundColor Cyan
  Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

  $start = Get-Date
  npm run $t.cmd
  $exit = $LASTEXITCODE
  $elapsed = [int]((Get-Date) - $start).TotalSeconds

  if ($exit -eq 0) {
    $results += "✅ $($t.name) (${elapsed}s)"
    Write-Host "PASSED en ${elapsed}s" -ForegroundColor Green
  } else {
    $results += "❌ $($t.name) (exit $exit)"
    Write-Host "FAILED (exit $exit)" -ForegroundColor Red
  }

  if ($i -lt $tests.Length - 1) {
    Write-Host "Esperando ${wait}s para que se resetee el rate limit de Groq..." -ForegroundColor Yellow
    Start-Sleep -Seconds $wait
  }
}

Write-Host ""
Write-Host "══════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "           RESUMEN FINAL DE TESTS" -ForegroundColor Magenta
Write-Host "══════════════════════════════════════════════" -ForegroundColor Magenta
foreach ($r in $results) {
  $color = if ($r.StartsWith("✅")) { "Green" } else { "Red" }
  Write-Host $r -ForegroundColor $color
}
Write-Host "══════════════════════════════════════════════" -ForegroundColor Magenta
