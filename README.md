# Mawid Skeleton

Minimal monorepo layout: Android (Compose + Navigation), Vite + React web shell, and one Supabase migration placeholder.

## Android (`Mawid-Android/`)

- Same `namespace` / `applicationId`: `com.mawidplus.patient`
- Entry: `MainActivity` → `MawidTheme` → `AppNavGraph`
- `PatientApp` is an empty `Application` subclass (placeholder)
- `ui/screens/...` composables are placeholders wired in `AppNavGraph`

Build (if `JAVA_HOME` points to a bad path, clear it or set a valid JDK 17):

```powershell
cd Mawid-Android
$env:JAVA_HOME = $null   # optional: use JDK from PATH
.\gradlew.bat assembleDebug
```

## Web (`Mawid-Web/`)

```powershell
cd Mawid-Web
npm install
npm run dev
```

## Supabase

`supabase/migrations/` contains a no-op migration so the migrations folder stays part of the workflow.
