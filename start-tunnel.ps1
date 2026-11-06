$webDir = "C:\Users\ASUS\.gemini\antigravity\scratch\om-trip-2026-prize"
$port = 5050

# Stop old processes if any
Get-Process -Name "ngrok" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Start python http server in background
$server = Start-Process python -ArgumentList "-m", "http.server", "$port", "--directory", "`"$webDir`"" -PassThru -WindowStyle Hidden

# Start ngrok
$ngrokPath = "C:\Users\ASUS\OneDrive\Desktop\ngrok.exe"
$ngrok = Start-Process $ngrokPath -ArgumentList "http", "$port" -PassThru -WindowStyle Hidden

# Wait for ngrok API
Start-Sleep -Seconds 4

for ($i = 0; $i -lt 5; $i++) {
    try {
        $resp = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -TimeoutSec 2
        $httpsTunnel = $resp.tunnels | Where-Object { $_.proto -eq "https" }
        if ($httpsTunnel) {
            Write-Output "SUCCESS: $($httpsTunnel.public_url)"
            break
        }
    } catch {
        Start-Sleep -Seconds 2
    }
}

