$envVars = @{
    "VITE_FIREBASE_API_KEY" = "AIzaSyCrAzLdxHnc004x2WayZl5JJxa_Bn6iPTk"
    "VITE_FIREBASE_AUTH_DOMAIN" = "local-services-app-fd246.firebaseapp.com"
    "VITE_FIREBASE_PROJECT_ID" = "local-services-app-fd246"
    "VITE_FIREBASE_STORAGE_BUCKET" = "local-services-app-fd246.firebasestorage.app"
    "VITE_FIREBASE_MESSAGING_SENDER_ID" = "777053509850"
    "VITE_FIREBASE_APP_ID" = "1:777053509850:web:9b98bb09b1618ed326ade3"
    "VITE_FIREBASE_MEASUREMENT_ID" = "G-26RMS6K9MV"
}

foreach ($key in $envVars.Keys) {
    Write-Host "Adding $key..."
    $val = $envVars[$key]
    # Pipe the value to npx vercel env add for 'production'
    # Using cmd /c echo to ensure pure stdout without powershell object wrapping if needed, but simple pipe usually works.
    $val | npx vercel env add $key production
}
