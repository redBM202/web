Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"

# Wait for Docker Desktop to be fully running
$dockerProcess = Get-Process | Where-Object { $_.Name -like '*docker*' } | Select-Object -First 1
while ($null -eq $dockerProcess) {
    Start-Sleep -Seconds 5
    $dockerProcess = Get-Process | Where-Object { $_.Name -like '*docker*' } | Select-Object -First 1
}

# Wait for Docker to be fully initialized
while (-not (docker info -ErrorAction SilentlyContinue)) {
    Start-Sleep -Seconds 5
}

# Output the uptime in JSON format
if ($dockerProcess) {
    $uptime = (Get-Date) - $dockerProcess.StartTime
    $uptime | Select-Object Days, Hours, Minutes, Seconds | ConvertTo-Json
} else {
    Write-Host "Docker Desktop is not running."
}