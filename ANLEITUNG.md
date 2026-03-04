# FamInventar - Setup-Anleitung & Changelog

## Was wurde gemacht?

### Bug-Fixes

1. **Tracker konnte nicht erstellt werden (kritisch)**
   - **Problem:** In `migration-v4.sql` fehlte `DEFAULT auth.uid()` bei `user_id` in den Tabellen `fm_trackers`, `fm_tracker_entries` und `fm_smoking_materials`. Dadurch schlug jedes INSERT fehl, weil die Datenbank keinen Wert fuer `user_id` hatte.
   - **Fix:** `DEFAULT auth.uid()` zu allen drei Tabellen hinzugefuegt.
   - **Dateien:** `supabase/migration-v4.sql` (korrigiert), `supabase/fix-tracker-bug.sql` (ALTER-Script fuer bestehende DBs)

2. **Register-Seite leitete zu `/setup` weiter (existiert nicht)**
   - **Problem:** Nach Registrierung wurde zu `/setup` navigiert, diese Route gibt es nicht.
   - **Fix:** Weiterleitung geht jetzt zu `/` (Dashboard).
   - **Datei:** `src/pages/auth/Register.jsx`

### Layout-Umbau (App-Design)

3. **BottomNav komplett neu**
   - Vorher: Dashboard, Inventar, +, Spiel, Stats
   - Jetzt: **Home, Inventar, Handel, Tracker, Mehr**
   - Alle Module direkt erreichbar, aktiver Tab mit Indikator-Linie
   - **Datei:** `src/components/layout/BottomNav.jsx`

4. **Neue "Mehr"-Seite**
   - Enthalt: Benutzer-Info, Spielprotokoll, Statistik, Abmelden
   - **Datei:** `src/pages/More.jsx` (neu), Route in `src/App.jsx`

5. **Header redesigned**
   - Mobile: Kein Hamburger-Menu mehr (BottomNav ist primaer), dafuer Zurueck-Taste auf Unterseiten
   - Dynamische Seitentitel je nach Route
   - Desktop: Menu-Toggle fuer Sidebar bleibt
   - **Datei:** `src/components/layout/Header.jsx`

6. **Sidebar verbessert**
   - Gruppierte Navigation: Inventar, Handel, Tracker mit Sub-Links
   - User-Info + Logout im Footer
   - **Datei:** `src/components/layout/Sidebar.jsx`

7. **CSS Mobile-Optimierung**
   - iOS Safe Areas (Notch/Home-Indicator)
   - `active:scale` Touch-Feedback auf Buttons/Cards
   - `100dvh` fuer korrekte Mobile-Hoehe
   - Kein Tap-Highlight, kein Overscroll-Bounce
   - **Datei:** `src/index.css`

8. **PWA-Vorbereitung im HTML**
   - `viewport-fit=cover`, `apple-mobile-web-app-capable`, `theme-color`
   - **Datei:** `index.html`

### Beispieldaten

9. **30 Beispieleintraege als SQL-Script**
   - 5 Sammlungen, 15 Gegenstaende, 9 Spielprotokolle
   - 3 Produkte, 5 Einkaeufe, 4 Verkaeufe
   - 3 Tracker, 23 Eintraege, 3 Rauchmaterialien
   - **Datei:** `supabase/seed-30-examples.sql`

---

## Schritt-fuer-Schritt Setup

### 1. Supabase-Datenbank einrichten

Gehe zu [https://supabase.com/dashboard](https://supabase.com/dashboard) und oeffne dein Projekt (`vyxjcsdqynbfpnccxjcp`).

Navigiere zu **SQL Editor** (links im Menu).

Fuehre diese SQL-Scripts **in dieser Reihenfolge** aus:

| # | Datei | Beschreibung |
|---|-------|-------------|
| 1 | `supabase/migration-v1.sql` | Basis-Tabellen (Sammlungen, Gegenstaende, Spielprotokoll) |
| 2 | `supabase/migration-v2.sql` | Erweiterte Item-Felder (Ort, Kaufart, Beleg) |
| 3 | `supabase/migration-v3.sql` | Handel-Modul (Produkte, Einkaeufe, Verkaeufe) |
| 4 | `supabase/migration-v4.sql` | Tracker-Modul (jetzt mit korrigiertem `DEFAULT auth.uid()`) |

**Falls die Tabellen schon existieren** (du aber den Tracker-Bug hast):
- Fuehre stattdessen nur `supabase/fix-tracker-bug.sql` aus

#### Storage-Bucket erstellen

Im Supabase Dashboard:
1. Gehe zu **Storage** (links im Menu)
2. Klicke **New Bucket**
3. Name: `family-items`
4. Public: **Ein** (fuer Bild-URLs)
5. Erstelle eine Policy: `Allow authenticated uploads` (INSERT fuer authenticated users)
6. Erstelle eine Policy: `Allow public reads` (SELECT fuer alle)

### 2. Beispieldaten laden (optional)

Wenn du Testdaten willst:
1. **Zuerst** im Browser registrieren/einloggen (damit ein User existiert)
2. Dann in Supabase SQL Editor: `supabase/seed-30-examples.sql` ausfuehren
   - Das Script nutzt `auth.uid()` -- funktioniert NUR wenn du ueber die Supabase UI eingeloggt bist
   - **Alternative:** Ersetze im Script `auth.uid()` durch deine User-UUID (findbar unter Authentication > Users)

### 3. .env Datei erstellen

Erstelle im Projekt-Root eine `.env` Datei:

```
VITE_SUPABASE_URL=https://vyxjcsdqynbfpnccxjcp.supabase.co
VITE_SUPABASE_ANON_KEY=DEIN_ANON_KEY_HIER
```

Den Anon Key findest du unter: Supabase Dashboard > Project Settings > API > `anon` / `public` Key.

### 4. Lokal starten

```bash
npm install
npm run dev
```

Die App laeuft dann unter `http://localhost:5173`

### 5. Deployment (Vercel)

```bash
npm run build
```

Oder direkt mit Vercel verbinden:
1. Vercel-Konto erstellen
2. GitHub-Repo verbinden
3. Environment Variables setzen (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
4. Deploy

---

## Projektstruktur

```
src/
  components/
    layout/          # AppLayout, Header, Sidebar, BottomNav
    tracker/         # TrackerSummaryCard, GoalProgressBar, etc.
  lib/
    api.js           # Inventar CRUD
    api-handel.js    # Handel CRUD
    api-tracker.js   # Tracker CRUD
    storage.js       # Bild-Upload
    constants.js     # Labels, Kategorien, Presets
    supabase.js      # Supabase Client
    AuthContext.jsx   # Auth Context Provider
  pages/
    auth/            # Login, Register
    handel/          # HandelDashboard, Produkte, ProduktDetail, etc.
    tracker/         # TrackerDashboard, TrackerListe, TrackerDetail, etc.
    Dashboard.jsx    # Hauptseite
    Collections.jsx  # Sammlungen
    More.jsx         # Mehr-Seite (Spiellog, Statistik, Logout)
supabase/
  migration-v1.sql   # Basis-Schema
  migration-v2.sql   # Item-Erweiterungen
  migration-v3.sql   # Handel-Modul
  migration-v4.sql   # Tracker-Modul (gefixt)
  fix-tracker-bug.sql # Hotfix fuer bestehende DBs
  seed-30-examples.sql # 30 Beispieleintraege
```

---

## Bekannte Hinweise

- **N+1 Query in Collections.jsx:** Items werden pro Sammlung einzeln geladen. Bei vielen Sammlungen kann das langsam werden. Optimierung: Ein einziger API-Call mit JOIN.
- **Storage-Bucket:** Muss manuell in Supabase erstellt werden (siehe Schritt 1).
- **Seed-Script:** Nutzt `auth.uid()` -- fuer Supabase SQL Editor muss man eingeloggt sein oder die UUID manuell einsetzen.
