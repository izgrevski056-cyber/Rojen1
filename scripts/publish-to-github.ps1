# Publish Rozhen 1 to GitHub and enable GitHub Pages
$ErrorActionPreference = "Stop"
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Set-Location $PSScriptRoot\..

Write-Host "Checking GitHub authentication..." -ForegroundColor Cyan
gh auth status | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Not logged in. Starting GitHub login (browser)..." -ForegroundColor Yellow
  gh auth login --web --git-protocol https --skip-ssh-key
}

$username = gh api user --jq .login
$repoName = "rozhen1"
Write-Host "Logged in as: $username" -ForegroundColor Green

if (git remote get-url origin 2>$null) {
  Write-Host "Remote 'origin' already exists." -ForegroundColor Yellow
} else {
  Write-Host "Creating GitHub repo $username/$repoName ..." -ForegroundColor Cyan
  gh repo create $repoName --public --source=. --remote=origin --description 'Rozhen 1 delivery driver PWA - daily deliveries, turnover and salary tracking'
}

Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
git push -u origin main

Write-Host "Enabling GitHub Pages (Actions workflow)..." -ForegroundColor Cyan
gh api --method PUT "repos/$username/$repoName/pages" -f build_type=workflow 2>$null

Write-Host ""
Write-Host "Done!" -ForegroundColor Green
Write-Host "Repo:    https://github.com/$username/$repoName"
Write-Host "Actions: https://github.com/$username/$repoName/actions"
Write-Host "Pages:   https://github.com/$username/$repoName/settings/pages"
Write-Host ""
Write-Host "After the deploy workflow finishes (~1 min), live site:"
Write-Host "  https://$username.github.io/$repoName/" -ForegroundColor Cyan
