param(
  [Parameter(Mandatory = $true)]
  [string]$FunctionName
)

$projectRef = "hblczvmpyaznbxvdcaze"

Write-Host "Fazendo deploy de: $FunctionName" -ForegroundColor Cyan
Write-Host "Project ref: $projectRef" -ForegroundColor DarkGray

npx supabase functions deploy $FunctionName --project-ref $projectRef --no-verify-jwt

if ($LASTEXITCODE -eq 0) {
  Write-Host "Deploy de '$FunctionName' concluido com sucesso." -ForegroundColor Green
} else {
  Write-Host "Deploy de '$FunctionName' falhou. Verifique o log acima." -ForegroundColor Red
}
