# Push remaining commits forward to origin main
$ErrorActionPreference = "Stop"

$currentRemote = (git ls-remote origin refs/heads/main).Split("`t")[0].Trim()
Write-Host "Current origin main is at: $currentRemote"

$remainingCommits = git rev-list --reverse "$currentRemote..main"
$total = $remainingCommits.Count
Write-Host "Remaining commits to push: $total"

$i = 1
foreach ($commit in $remainingCommits) {
    $msg = (git log -1 --pretty=%s $commit)
    Write-Host "[$i / $total] Pushing: $commit - $msg"
    git push origin "${commit}:refs/heads/main"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed pushing $commit"
        exit 1
    }
    $i++
}

Write-Host "All commits successfully pushed sequentially to origin main!" -ForegroundColor Green
