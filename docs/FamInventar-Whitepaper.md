# FamInventar — Whitepaper

**Persönliche Lebens- und Geschäftsmanagement-Plattform**

Version 1.0 · März 2026

---

## 1. Executive Summary

FamInventar ist eine modulare Webanwendung zur Verwaltung des persönlichen und geschäftlichen Alltags. Die Plattform vereint sechs Kernbereiche in einem einzigen System:

1. **Inventar** — Haushaltsinventar mit 35+ Kategorien, Fotoverwaltung und Wertberechnung
2. **Handel** — Warenhandel mit Chargen-Tracking, Teilverkäufen und Margenberechnung
3. **Tracker** — Gewohnheits-Tracking mit Kostenberechnung, Reduktionsmodus und Streak-System

Geplante Module:

4. **Konsum-Tracker** — Katalogbasiertes Konsum-Tracking (Getränke, Snacks) mit Koffein-/Zuckerübersicht
5. **Arbeit & Projekte** — Zeiterfassung mit Timer, Schwierigkeitsmultiplikator und Projekt-Controlling
6. **Zeit vs. Geld** — Cross-Modul-Analyse: Arbeitseinnahmen vs. Konsumausgaben

**Technologie:** React 18 + Vite + Tailwind CSS + Supabase (Auth, PostgreSQL, Storage)

---

## 2. Problemstellung

Im Alltag verwenden die meisten Menschen separate Tools für verschiedene Bereiche:

- Eine App für Inventar/Versicherung
- Excel für Handelskalkulationen
- Eine Habit-Tracker-App für Gewohnheiten
- Einen separaten Timer für Arbeitszeit
- Manuelle Berechnungen für Kosten und Ersparnisse

Diese Fragmentierung führt zu:

- **Datenverlust** — Informationen verteilt über mehrere Systeme
- **Fehlende Querverbindungen** — Keine Analyse zwischen Einnahmen und Ausgaben
- **Redundante Dateneingabe** — Gleiche Informationen mehrfach erfassen
- **Mangelnde Übersicht** — Kein einheitliches Dashboard

FamInventar löst dieses Problem durch eine integrierte Plattform mit einem zentralen Dashboard und modularem Aufbau.

---

## 3. Systemarchitektur

### 3.1 Technologie-Stack

| Schicht | Technologie | Version |
|---------|------------|---------|
| Frontend | React | 18.3.1 |
| Build-Tool | Vite | 5.4 |
| Styling | Tailwind CSS | 3.4 |
| Backend | Supabase | — |
| Datenbank | PostgreSQL | 15+ |
| Authentifizierung | Supabase Auth | — |
| Dateispeicher | Supabase Storage | — |
| Charts | Recharts | 2.12.7 |
| Icons | Lucide React | — |
| Routing | React Router | 6 |

### 3.2 Datenbankarchitektur

Alle Tabellen folgen einheitlichen Konventionen:

- **Prefix:** `fm_` (FamInventar)
- **Primärschlüssel:** UUID via `gen_random_uuid()`
- **Eigentümer:** `user_id` Spalte auf jeder Tabelle
- **Sicherheit:** Row Level Security (RLS) mit `user_id = auth.uid()`
- **Zeitstempel:** `created_at TIMESTAMPTZ DEFAULT now()`

```
┌─────────────────────────────────────────────────┐
│                  Supabase Auth                   │
│              (Benutzer-Verwaltung)                │
└────────────────────┬────────────────────────────┘
                     │ user_id
    ┌────────────────┼────────────────┐
    │                │                │
┌───┴───┐      ┌────┴────┐     ┌────┴────┐
│Inventar│      │ Handel  │     │ Tracker │
│       │      │         │     │         │
│fm_coll│      │fm_prod  │     │fm_track │
│fm_item│      │fm_purch │     │fm_entry │
│fm_play│      │fm_sales │     │fm_smoke │
└───────┘      └─────────┘     └─────────┘
```

### 3.3 Sicherheitsmodell

Jede Datenbankabfrage wird durch RLS-Policies geschützt:

```sql
CREATE POLICY "Users manage own data"
  ON fm_tabelle FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

Damit ist sichergestellt, dass jeder Benutzer ausschließlich seine eigenen Daten sehen und bearbeiten kann — ohne zusätzliche Middleware oder Backend-Logik.

---

## 4. Modul: Inventar

### 4.1 Funktionsumfang

Das Inventar-Modul ermöglicht die vollständige Erfassung des Haushaltsbesitzes:

- **35+ Kategorien** — Von Schuhen über Elektronik bis Werkzeug
- **Fotoverwaltung** — Upload oder URL-basierte Bilder
- **Wertberechnung** — Automatische Summierung pro Kategorie
- **Standortverwaltung** — Zuhause, Keller, Garage, Büro, Ausgeborgt
- **Herkunfts-Tracking** — Gekauft (mit Geschäft, Datum, Rechnung) oder Geschenkt (mit Anlass, Schenker)
- **Spielprotokoll** — Speziell für Spielzeug: Häufigkeit, Dauer, Top-5 Ranking

### 4.2 Datenmodell

| Tabelle | Beschreibung | Felder |
|---------|-------------|--------|
| `fm_collections` | Kategorien/Inventar-Gruppen | name, icon, description |
| `fm_items` | Einzelne Gegenstände | name, value, image_url, location, borrowed_to, acquired_type, store, gifted_from, occasion, acquired_date, receipt_url |
| `fm_play_logs` | Spielprotokoll | item_id, duration_minutes, notes, played_at |

### 4.3 Dashboard-Integration

Das zentrale Dashboard zeigt:

- Gesamtwert aller Gegenstände
- Anzahl Kategorien und Teile
- Spielstunden gesamt
- Top 5 Lieblingsspielzeuge (gewichtetes Ranking)
- Wert-Verteilung pro Kategorie (Balkendiagramm)

---

## 5. Modul: Handel

### 5.1 Funktionsumfang

Das Handel-Modul bietet vollständiges Chargen-basiertes Warentracking:

- **Produkte** — Warendefinitionen mit Einheit, Kategorie, Mindestbestand
- **Einkäufe (Chargen)** — Automatische Chargen-Nr. (z.B. `TEE-2026-001`), Mengen- und Preiserfassung
- **Teilverkäufe** — Partielle Verkäufe aus Chargen mit automatischer Restbestand-Berechnung
- **Margenkalkulation** — Echtzeit-Gewinnberechnung pro Verkauf und pro Charge
- **Auto-Status** — Automatische Statusaktualisierung: Eingekauft → Im Lager → Teilweise verkauft → Ausverkauft

### 5.2 Chargen-System

Jeder Einkauf erhält eine automatisch generierte Chargen-Nummer:

```
Produktname → Prefix (max 4 Zeichen, Großbuchstaben)
Jahr → 4-stellig
Laufende Nummer → 3-stellig, fortlaufend

Beispiel: TEE-2026-001, TEE-2026-002, KAFF-2026-001
```

### 5.3 Margenkalkulation

Für jeden Verkauf wird in Echtzeit berechnet:

```
Einkaufspreis pro Einheit = Gesamtpreis ÷ Menge
Kosten des Verkaufs = Verkaufsmenge × Einkaufspreis/Einheit
Gewinn = Verkaufspreis - Kosten
Marge = (Gewinn ÷ Verkaufspreis) × 100%
```

**Beispiel:**
- Einkauf: 1000g Sencha Tee für 60,00 € → 0,06 €/g
- Verkauf: 200g für 15,00 €
- Kosten: 200 × 0,06 = 12,00 €
- Gewinn: 15,00 - 12,00 = **3,00 €** (Marge: 20%)

### 5.4 Datenmodell

| Tabelle | Beschreibung | Schlüsselfelder |
|---------|-------------|-----------------|
| `fm_products` | Produktdefinitionen | name, category, unit, low_stock_threshold |
| `fm_purchases` | Einkäufe/Chargen | product_id, batch_id, quantity, total_price, supplier, status |
| `fm_sales` | Verkäufe | purchase_id, buyer, quantity, sale_price, status |

### 5.5 Warnungssystem

Das Dashboard zeigt automatisch Warnungen an:

- **Niedriger Bestand** — Wenn Restbestand unter definierten Mindestbestand fällt
- **Alte Chargen** — Wenn Chargen älter als 6 Monate sind und noch Restbestand haben

---

## 6. Modul: Tracker

### 6.1 Funktionsumfang

Das Tracker-Modul ist ein flexibles Gewohnheits- und Kostentracking-System:

- **4 Tracker-Typen:** Zähler, Kosten, Zeit, Kombi
- **Vorlagen:** Zigaretten, Fitness, Haushalt, Sauna
- **Eigene Tracker** — Frei konfigurierbar mit Icon, Farbe, Einheit
- **Tagesziele** — Maximum (nicht überschreiten) oder Minimum (mindestens erreichen)
- **Streak-System** — Tage in Folge, in denen das Ziel eingehalten wurde
- **Kostenberechnung** — Automatisch für verschiedene Konsumarten
- **Ersparnis-Rechner** — Interaktiver Slider zur Hochrechnung von Einsparungen

### 6.2 Zigaretten-Speziallogik

Das System unterscheidet drei Konsumarten:

| Art | Preisermittlung | Beispiel |
|-----|----------------|---------|
| **Gekauft** | Benutzerdefinierter Preis pro Stück | 0,35 € |
| **Gedreht** | Automatisch aus Materialkosten berechnet | 0,20 € |
| **E-Zigarette** | Benutzerdefinierter Preis pro Stück | 0,15 € |

#### Kostenberechnung für Selbstgedrehte

Materialien werden einmal definiert, die Kosten pro Stück automatisch berechnet:

```
Kosten/Stück = Σ (Verbrauch pro Zigarette ÷ Packungsmenge × Packungspreis)

Beispiel:
  Tabak:    0,7g × (7,00 € ÷ 30g)  = 0,163 €
  Blättchen: 1 Stk × (1,50 € ÷ 50)  = 0,030 €
  Filter:    1 Stk × (1,20 € ÷ 120) = 0,010 €
  ─────────────────────────────────────────
  Gesamt pro Zigarette:                 0,203 €
```

### 6.3 Tagesziel und Reduktionsmodus

Der Tracker unterstützt zwei Zielrichtungen:

**Maximum (↓):** Ziel ist es, den Wert NICHT zu überschreiten.
- Beispiel: „Maximal 10 Zigaretten pro Tag"
- ProgressBar: Grün → Gelb → Rot bei Annäherung ans Limit
- Streak: Tage in Folge unter dem Limit

**Minimum (↑):** Ziel ist es, den Wert MINDESTENS zu erreichen.
- Beispiel: „Mindestens 30 Minuten Training pro Tag"
- ProgressBar: Rot → Gelb → Grün bei Annäherung ans Ziel
- Streak: Tage in Folge mit erreichtem Minimum

### 6.4 Ersparnis-Rechner

Ein interaktiver Slider zeigt, wie viel Geld durch Reduktion gespart werden kann:

```
Eingabe: Aktuelle Durchschnitt 15/Tag, 5 weniger pro Tag
Kosten pro Stück: 0,35 €

Tägliche Ersparnis:   5 × 0,35 = 1,75 €
Monatliche Ersparnis: 1,75 × 30 = 52,50 €
Jährliche Ersparnis:  1,75 × 365 = 638,75 €
```

### 6.5 Datenmodell

| Tabelle | Beschreibung | Schlüsselfelder |
|---------|-------------|-----------------|
| `fm_trackers` | Tracker-Definitionen | name, icon, color, type, unit, daily_goal, goal_direction, cost_per_unit, subtypes[], is_smoking_tracker |
| `fm_tracker_entries` | Einzelne Einträge | tracker_id, date, count, cost, duration_minutes, subtype, time_of_day |
| `fm_smoking_materials` | Materialien (Gedrehte) | tracker_id, name, package_amount, package_unit, package_price, usage_per_cig |

---

## 7. Geplant: Konsum-Katalog

### 7.1 Konzept

Erweiterung des Tracker-Moduls um ein Katalog-System: Konsumgüter einmal definieren, dann per Schnelltipp erfassen.

**Anwendungsbeispiele:**

| Getränk | Größe | Preis | Koffein |
|---------|-------|-------|---------|
| Energy Drink | 250 ml | 1,80 € | 80 mg |
| Coca-Cola | 500 ml | 2,20 € | 50 mg |
| Kaffee | 200 ml | 0,50 € | 95 mg |
| Wasser | 500 ml | 0,00 € | 0 mg |

**Tagesansicht:**
```
Heute:
  ⚡ Energy Drink × 2    3,60 €   160 mg Koffein
  🥤 Coca-Cola × 1       2,20 €    50 mg Koffein
  ────────────────────────────────────────
  Gesamt: 3 Getränke     5,80 €   210 mg Koffein
```

### 7.2 Koffein-Tracking

Grenzwerte zur Gesundheitsübersicht:

- **< 200 mg** — Moderat (Grün)
- **200–400 mg** — Erhöht (Gelb)
- **> 400 mg** — Hoch (Rot) — FDA-Empfehlung: max. 400 mg/Tag

---

## 8. Geplant: Arbeit & Projekte

### 8.1 Timer-System

Integrierte Zeiterfassung mit Start/Pause/Fortsetzen/Stop:

```
09:00  ▶ Start (Projekt: Supersonic Analyzer)
12:00  ⏸ Pause
12:30  ▶ Fortsetzen
16:30  ⏹ Stop

Arbeitszeit: 7:00h (abzgl. 30 Min. Pause)
```

Der Timer persistiert via localStorage über Seitennavigation hinweg. Ein kompaktes Timer-Badge wird in der Kopfzeile angezeigt, solange eine Sitzung läuft.

### 8.2 Schwierigkeitsmultiplikator

Nach jeder Arbeitssitzung wird die Schwierigkeit bewertet (1–10):

| Schwierigkeit | Multiplikator | Effektiver Stundensatz (Basis 35 €) |
|:---:|:---:|---:|
| 1 | 1,0× | 35,00 € |
| 2 | 1,1× | 38,50 € |
| 3 | 1,2× | 42,00 € |
| 4 | 1,3× | 45,50 € |
| 5 | 1,5× | 52,50 € |
| 6 | 1,7× | 59,50 € |
| 7 | 2,0× | 70,00 € |
| 8 | 2,3× | 80,50 € |
| 9 | 2,6× | 91,00 € |
| 10 | 3,0× | 105,00 € |

**Berechnungsformel:**
```
Sitzungswert = Arbeitsstunden × Stundensatz × Multiplikator

Beispiel:
  7h × 35 € × 2,3 (Schwierigkeit 8) = 563,50 €
```

### 8.3 Projekt-Controlling

Jedes Projekt zeigt aggregierte Statistiken:

```
┌──────────────────────────────────┐
│ Supersonic Analyzer              │
│──────────────────────────────────│
│ Gesamtzeit:       42 Stunden     │
│ Schwierigkeit Ø:  7,4            │
│ Projektwert:      3.250 €        │
│ Sitzungen:        12             │
│ Stundensatz:      35 €           │
│ Eff. Stundensatz: 77,38 € (Ø)   │
└──────────────────────────────────┘
```

### 8.4 Kunden-Verwaltung

Projekte können optional Kunden zugeordnet werden:

```
Kunde: Agentur XYZ
  ├─ Projekt A: 120h, 4.200 €
  ├─ Projekt B:  45h, 1.890 €
  └─ Projekt C:  18h,   945 €
  ─────────────────────────────
  Gesamt: 183h, 7.035 €
```

---

## 9. Geplant: Zeit vs. Geld — Cross-Modul-Analyse

### 9.1 Konzept

Die leistungsstärkste Funktion der Plattform: modulübergreifende Analyse, die Arbeitseinnahmen den Konsumausgaben gegenüberstellt.

```
┌──────────────────────────────────────────┐
│           Diese Woche                     │
│──────────────────────────────────────────│
│ 💼 Verdienst (Arbeit):        820,00 €   │
│                                          │
│ 🚬 Zigaretten:                -37,80 €   │
│ ⚡ Energy Drinks:              -12,60 €   │
│ 🥤 Getränke sonstig:           -5,40 €   │
│ ─────────────────────────────────────    │
│ 📊 Konsumkosten gesamt:       -55,80 €   │
│                                          │
│ ✅ Netto-Produktivität:       764,20 €   │
│                                          │
│ ⏰ 2 Stunden Arbeit gingen für           │
│    Zigaretten und Getränke drauf.        │
└──────────────────────────────────────────┘
```

### 9.2 Motivationseffekt

Diese Analyse macht abstrakte Kosten greifbar:

- „54 € pro Woche für Zigaretten" klingt abstrakt
- „2 Stunden deiner Arbeitszeit gehen für Zigaretten drauf" ist konkret

Das Dashboard wird zum Spiegel: ehrlich, datenbasiert, ohne Moralpredigt.

---

## 10. UI/UX-Design

### 10.1 Designprinzipien

- **Warme Farbpalette** — Braun-/Orangetöne als Primärfarben
- **Klare Typografie** — Headings in `font-heading` (Bold), klare Hierarchie
- **Mobile-First** — Responsive Layout mit Sidebar (Desktop) und Bottom-Navigation (Mobile)
- **Skeleton-Loading** — Animierte Platzhalter während Daten laden
- **Sofortiges Feedback** — Toast-Benachrichtigungen bei jeder Aktion

### 10.2 Komponentensystem

Einheitliche Tailwind-Klassen für konsistentes Design:

| Klasse | Verwendung |
|--------|-----------|
| `fm-card` | Interaktive Karte (Hover-Effekt) |
| `fm-card-static` | Statische Karte (kein Hover) |
| `fm-stat-card` | Statistik-Karte mit Wert |
| `fm-btn-primary` | Primärer Aktionsbutton |
| `fm-btn-ghost` | Sekundärer/subtiler Button |
| `fm-input` | Eingabefeld |
| `fm-select` | Dropdown-Auswahl |
| `fm-badge` | Status-Badge/Tag |
| `fm-label` | Formular-Label |

### 10.3 Navigation

```
┌──────────────────────────┐
│ Sidebar                  │
│──────────────────────────│
│ 📊 Übersicht             │
│ 📁 Inventar              │
│ 🎮 Spielprotokoll        │
│ 📈 Statistik             │
│ ─────────────────────    │
│ HANDEL                   │
│ 🛒 Handel                │
│ ─────────────────────    │
│ TRACKER                  │
│ 📋 Tracker               │
│ ─────────────────────    │
│ ARBEIT (geplant)         │
│ 💼 Arbeit                │
└──────────────────────────┘
```

---

## 11. Datenschutz und Sicherheit

### 11.1 Datenisolierung

- **Row Level Security (RLS)** auf jeder Tabelle
- Jeder Benutzer sieht ausschließlich seine eigenen Daten
- Keine geteilten Daten zwischen Benutzern
- Kein Admin-Zugang auf Anwendungsebene

### 11.2 Authentifizierung

- Supabase Auth mit E-Mail/Passwort
- JWT-basierte Session-Verwaltung
- Automatische Token-Erneuerung
- Geschützte Routen mit AuthRoute-Wrapper

### 11.3 Dateispeicher

- Fotos und Rechnungen in Supabase Storage
- Bucket mit Benutzer-spezifischen Pfaden
- Maximale Dateigröße: 5 MB
- Unterstützte Formate: JPEG, PNG, WebP

---

## 12. Technische Kennzahlen

| Metrik | Wert |
|--------|------|
| Datenbankmigrationen | 4 (v1–v4) |
| Datenbanktabellen | 9 |
| RLS-Policies | 9 (eine pro Tabelle) |
| API-Funktionen | ~60 |
| React-Seiten | 16 |
| React-Komponenten | 15+ |
| Zeilen Code (Frontend) | ~5.000+ |
| Zeilen SQL | ~300+ |
| Build-Größe | ~710 KB (gzip: ~194 KB) |
| Externe Abhängigkeiten | React, Supabase, Recharts, Tailwind, Lucide, React Router, React Hot Toast |

---

## 13. Roadmap

### Phase 1 — Abgeschlossen ✅

- [x] Inventar-Modul (Kategorien, Gegenstände, Fotos, Werte)
- [x] Erweiterte Felder (Standort, Herkunft, Rechnung)
- [x] Handel-Modul (Produkte, Chargen, Teilverkäufe, Margen)
- [x] Tracker-Modul (Gewohnheiten, Zigaretten-Kosten, Streaks, Ersparnis)

### Phase 2 — In Planung

- [ ] Konsum-Katalog (Getränke-Tracking, Koffein/Zucker)
- [ ] Arbeit & Projekte (Timer, Schwierigkeitsmultiplikator)
- [ ] Kunden-Verwaltung
- [ ] Zeit vs. Geld Cross-Modul-Analyse

### Phase 3 — Zukunft

- [ ] Wochenbericht (automatisierte Zusammenfassung)
- [ ] Rechnungs-Vorschau (aus Arbeitssitzungen)
- [ ] Export-Funktionen (CSV, PDF)
- [ ] Dark Mode
- [ ] PWA (Progressive Web App) für Offline-Nutzung

---

## 14. Fazit

FamInventar ist keine einzelne App — es ist eine persönliche Lebens- und Geschäftsmanagement-Plattform. Die modulare Architektur ermöglicht schrittweise Erweiterung, ohne bestehende Funktionalität zu beeinträchtigen.

Die Stärke des Systems liegt in der Integration: Wo andere Anwendungen isolierte Datenpunkte liefern, schafft FamInventar Querverbindungen zwischen Arbeit, Konsum und Gewohnheiten. Das Ergebnis ist ein ehrliches, datenbasiertes Spiegelbild des Alltags.

Manchmal reicht ein Dashboard, um Gewohnheiten zu ändern. Manchmal auch nicht. Menschen sind kompliziert. Systeme sind wenigstens ehrlich.

---

*FamInventar — Entwickelt 2026*
*React · Supabase · Tailwind CSS*
