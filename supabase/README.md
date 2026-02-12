# Datenbank (Supabase) einrichten

Wenn du Supabase nutzt, werden **Angebote, Anfragen, Bewertungen, Blog/Events, Startseiten-Karten** in einer echten Datenbank gespeichert – für alle Besucher sichtbar und dauerhaft.

## 1. Projekt bei Supabase anlegen

1. Gehe auf [supabase.com](https://supabase.com) und melde dich an (kostenlos).
2. **New Project** → Name z. B. „yoga-rose“, Region wählen, Passwort setzen → **Create**.
3. Warte, bis das Projekt bereit ist.

## 2. Tabellen anlegen

1. Im Supabase-Dashboard links **SQL Editor** öffnen.
2. **New query** klicken.
3. Den **kompletten Inhalt** der Datei `schema.sql` (in diesem Ordner) reinkopieren.
4. **Run** (oder Strg+Enter) ausführen.
5. Es sollten Meldungen wie „Success. No rows returned“ erscheinen – die Tabellen sind dann angelegt.

## 3. URL und Anon-Key holen

1. Im Supabase-Dashboard links **Project Settings** (Zahnrad) → **API**.
2. Dort findest du:
   - **Project URL** (z. B. `https://xxxx.supabase.co`)
   - **anon public** (unter „Project API keys“) – das ist der **anon key**.

## 4. Umgebungsvariablen setzen

### Lokal (z. B. Cursor / Vite)

Im Projektordner eine Datei **`.env.local`** anlegen (falls noch nicht vorhanden):

```
VITE_SUPABASE_URL=https://dein-projekt.supabase.co
VITE_SUPABASE_ANON_KEY=dein-anon-key-hier
```

Statt `dein-projekt` und `dein-anon-key-hier` die echten Werte aus Schritt 3 eintragen.

### Auf Vercel

1. Vercel-Dashboard → dein Projekt **Yoga-Rose.ch** → **Settings** → **Environment Variables**.
2. Zwei Variablen anlegen:
   - **Name:** `VITE_SUPABASE_URL` | **Value:** deine Project URL
   - **Name:** `VITE_SUPABASE_ANON_KEY` | **Value:** dein anon key
3. **Save** → danach einen neuen **Redeploy** starten (Deployments → … → Redeploy).

## 5. Verhalten der App

- **Mit gesetzten Variablen:** Die App spricht mit Supabase. Alle Daten (Angebote, Bewertungen, Buchungen, Blog, Startseiten-Karten) liegen in der Datenbank und sind für alle Nutzer gleich.
- **Ohne Variablen:** Die App nutzt weiterhin nur den lokalen Speicher (localStorage) – wie bisher ohne Datenbank.

Nach dem Einrichten und Redeploy kannst du unter `/admin123123445566` Angebote, Bewertungen und Events anlegen; sie bleiben in der Datenbank erhalten und erscheinen für alle Besucher.

---

## Fehlersuche

- **Im Browser:** Entwicklertools (F12) → Reiter **Console**. Bei Supabase-Fehlern erscheint dort z. B. `[Supabase] services list: ...` mit der genauen Meldung.
- **„relation does not exist“** → Tabellen fehlen. Schema im SQL Editor komplett ausführen (siehe Schritt 2).
- **„Invalid API key“ / 401** → Falscher Key. Im Supabase-Dashboard unter **Project Settings** → **API** den Schlüssel **„anon“ (public)** kopieren (langer Text, beginnt oft mit `eyJ...`) und als `VITE_SUPABASE_ANON_KEY` eintragen. Alternativ den **Publishable**-Key verwenden, falls angeboten.
- **Lokal keine Verbindung** → `.env.local` muss im **Projektordner** (dort wo `package.json` liegt) liegen. Nach Änderung an `.env.local` Dev-Server neu starten (`npm run dev`).
