# Build the app, start the API (which also serves the web app), and open an HTTPS tunnel for your phone.
# Requires: MongoDB running, backend/.env configured, cloudflared installed.
Push-Location "$PSScriptRoot\frontend"; npm run build; Pop-Location
Start-Process -NoNewWindow node -ArgumentList "server.js" -WorkingDirectory "$PSScriptRoot\backend"
Start-Sleep 5
Write-Host "Open the https://*.trycloudflare.com link below on your phone in Chrome, then menu > Install app."
cloudflared tunnel --url http://localhost:5000
