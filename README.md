# Anami App Agenda

## Publicacion

eas build --profile production --platform android
$env:EXPO_PUBLIC_API_URL="https://api.ikedadev.com/anami/v1"; eas update --branch production --message "Forzando URL Prod"
eas update --branch production --message ""
