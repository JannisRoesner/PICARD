# **PICARD** - **P**rogramm- & **I**nformations-**C**enter für **A**blauf-, **R**egie- & Mo**d**eration

Eine moderne Webanwendung für die professionelle Durchführung von Karnevalssitzungen mit Echtzeit-Kollaboration zwischen Moderation, Technik und Kulissen.


## 🎯 Features

### Moderations-Ansicht
![](/Screenshot1.png)
- **Programmablauf**: Übersicht aller Programmpunkte mit Nummerierung
- **Live-Textbearbeitung**: Direkte Bearbeitung von Anmoderation, Notizen und Abmoderation
- **Namensliste**: Personen, die auftreten
- **Statusleiste**: Aktiver Programmpunkt, Einzug/Auszug (CD/Kapelle), Timer
- **Trainer/Betreuer**: Zuständige Personen
- **Live-Zettel**: Kommunikation mit Technik und anderen Ansichten
- **Zettel zu Programmpunkt**: Direkte Umwandlung von Zetteln in Programmpunkte

### Technik-Ansicht
![](/Screenshot2.png)
- **Programmablauf**: Übersicht aller Programmpunkte
- **Pinboard/Notizen**: Klebezettel pro Programmpunkt (Farben, Mehrzeilig, mit Titeln)
- **Audio-Dateien**: Upload mit Waveform-Visualisierung, Play/Pause-Steuerung
- **Statusleiste**: Aktiver Programmpunkt, Timer, Einzug/Auszug-Hinweise
- **Live-Zettel**: Kommunikation mit Moderation und anderen Ansichten

### Programmansicht
![](/Screenshot6.png)
- **Übersichtliche Darstellung**: Reine Anzeige des Programmablaufs ohne Bearbeitung

### Kulissen-Ansicht
![](/Screenshot3.png)
- **Musik-Informationen**: Einzug (→) und Auszug (←) von CD oder Kapelle mit farbigen Symbolen
- **Bühnenaufbau**: Details zu Bütt, Notenständer oder anderen Bühnenrequisiten
- **Live-Zettel**: Kommunikation mit anderen Ansichten (Banner für akute Meldungen)
- **Zettel-Historie-Panel**: Dauerhaftes Panel mit allen Zetteln der Sitzung (auf schmalen Screens einklappbar), analog zur Technik-Ansicht
- **Spezielle Anzeige**: Optimiert für Kulissenschieber

### Elferrat-Ansicht
- **Messenger-Design**: Durchgehender Chat-Verlauf statt fixiertem Banner/Modal – eigene Nachrichten rechts, eingehende links, chronologisch mit Auto-Scroll
- **Eingabeleiste unten**: Empfänger-Auswahl (`An Moderation/Technik/Kulissen/Küche/Alle`), Priorität und Textfeld (Enter sendet, Shift+Enter für neue Zeile)
- **Identität „Elferrat“**: Nachrichten werden als Elferrat gesendet
- **Empfang wie Moderation**: Elferrat sieht dieselben eingehenden Zettel wie die Moderation (`An Moderation` und `An Alle`)
- **Kein separater Empfänger**: Es gibt bewusst keinen eigenen Typ `An Elferrat`
- **Erledigt-Markierung**: Eingehende Nachrichten können als erledigt markiert werden; erledigte bleiben dezent im Verlauf

### Sitzungsablauf (Mobile)
![](/Screenshot5.png)
- **Mobile-optimiert**: Übersichtliche Darstellung für Smartphones
- **Live-Einfügung**: Neue Programmpunkte an beliebigen Positionen
- **Einfache Eingabe**: Nur Name, Dauer und Notizen bearbeitbar
- **Live-Zettel**: Erstellung von Zetteln für alle Beteiligten

### Programm bearbeiten
- **Vollständige Bearbeitung**: Alle Felder für komplette Programmpunkte
- **Drag & Drop**: Reihenfolge durch Ziehen ändern
- **Namensliste-Management**: Einfaches Hinzufügen/Entfernen von Namen
- **Bühneninformationen**: Spezielle Felder für Kulissen

### Drucken
- **Vier Druckoptionen**: Programmansicht, Kulissen, Moderation, Technik
- **Professionelle Layouts**: Optimiert für A4-Papier
- **Querformat**: Kulissen, Moderation und Technik im Landscape-Modus
- **Jahreszahl**: Automatisch in alle Überschriften eingefügt
- **Fußzeile**: Mit Server-URL und Hinweis auf Änderungen
- **Spezielle Ansichten**: Jede Druckoption zeigt relevante Informationen (inkl. Notiz-Titel und Audio-Dateien)
- **Clientseitige PDF-Generierung**: "Als PDF speichern" über Browser-Druckfunktion
- **Passwortgeschützt**: Erfordert Authentifizierung

### Timer-Funktionen
- **Automatischer Timer**: Startet automatisch bei Moderation-Auswahl
- **Synchronisation**: Timer zwischen allen Ansichten synchronisiert
- **Live-Timer**: Countdown für Programmpunkte mit Start/Stop/Pause
- **Farbkodierung**: Grün → Gelb → Rot je nach verbleibender Zeit
- **Aktiver Programmpunkt**: Blinkende Markierung

### Live-Zettel-System
![](/Screenshot7.png)
- **Bidirektionale Kommunikation**: Zwischen allen Ansichten
- **Prioritätsstufen**: Normal, Wichtig, Dringend mit Farbkodierung
- **Zettel-Typen**: An Moderation, An Technik, An Kulissen, An Küche, An Alle
- **Zettel-Historie**: Alle vergangenen Zettel einsehbar
- **Zettel schließen**: Statt löschen werden Zettel als "geschlossen" markiert
- **Echtzeit-Updates**: Sofortige Anzeige neuer Zettel mit Reconnect-Resync (inkl. Fallback-Synchronisierung)
![](/Screenshot8.png)

### Echtzeit-Funktionen
- **Socket.IO**: Live-Updates zwischen allen verbundenen Clients
- **Multi-User**: Mehrere Benutzer können gleichzeitig arbeiten
- **Automatisches Speichern**: Änderungen werden automatisch gespeichert

### Sicherheit & Verwaltung
![](/Screenshot9.png)
- **Passwortschutz**: Sensible Ansichten (Startseite, Moderation, Technik, Programm-bearbeiten, Drucken) erfordern Authentifizierung
- **Session-basierte Authentifizierung**: SQLite-gestützte Sessions mit 7-Tagen-Gültigkeit
- **Öffentliche Ansichten**: Zettel-API und Anzeige-Ansichten (Elferrat, Kulissen, Sitzungsablauf, Programmansicht) bleiben ohne Login zugänglich
- **Passwort-Verwaltung**: Initiales Passwort über Umgebungsvariable `ADMIN_PASSWORD` (Standard: "admin")
- **Export/Import**: Sitzungs-Export als ZIP mit allen Daten und Audio-Dateien

## 🗄️ Datenhaltung

Die Anwendung speichert Daten persistent in einer lokalen SQLite-Datenbank.
- Standardpfad: `./data/app.db` (konfigurierbar über Umgebungsvariable `DB_PATH`)
- Zettel werden nicht gelöscht, sondern als `geschlossen` markiert (Historie bleibt erhalten)
- Audio-Dateien werden im `./data` Verzeichnis gespeichert und bleiben persistiert
- In Docker wird das komplette `/app/data` Verzeichnis als Bind-Mount unter `./data` persistiert
- Passwort-Hashes werden bcrypt-verschlüsselt in der Datenbank gespeichert

## 🚀 Installation & Betrieb

### Docker (empfohlen)
```bash
# Build und Start (erstellt/aktualisiert DB-Schema automatisch)
docker compose up --build -d

# Anwendung öffnen
# http://localhost:5000

# Optionales Admin-Passwort setzen (sonst "admin")
ADMIN_PASSWORD=meinPasswort docker compose up --build -d
```

Persistenz:
- Bind-Mount: `./data` → `/app/data` (Datenbank und Audio-Dateien)
- Initial-Passwort: Umgebungsvariable `ADMIN_PASSWORD` (Standard: "admin")

### Lokale Installation
```bash
# Dependencies installieren
npm install
cd client && npm install && cd ..

# Server starten
node server.js

# Standard-DB-Pfad (falls nicht gesetzt): ./data/app.db
# Übersteuerbar mit Umgebungsvariable: DB_PATH=./mein/pfad.db node server.js
```

## 📱 Verwendung

1. Anwendung im Browser öffnen (`http://localhost:5000`)
2. "Neue Sitzung erstellen" klicken und Namen vergeben
3. Sitzung aktivieren und Programmpunkte verwalten
4. Verschiedene Ansichten nutzen:
   - **Moderation**: Für die Moderation während der Sitzung
   - **Elferrat**: Eigene Zettel-Ansicht mit Empfang wie Moderation
   - **Technik**: Für die Bühnentechnik
   - **Programmansicht**: Für Zuschauer und Übersicht
   - **Kulissen**: Für Kulissenschieber
   - **Sitzungsablauf**: Für mobile Eingaben
   - **Programm bearbeiten**: Für die Bearbeitung bestehender Programmpunkte
   - **Drucken**: Für professionelle Drucklayouts aller Ansichten

## 🏗️ Architektur

### Backend (Node.js/Express)
- **Node 24 + ESM**: Moderne Runtime, reines ES-Module-Setup
- **Express 5**: Web-Framework
- **Socket.IO**: Echtzeit-Kommunikation
- **SQLite (better-sqlite3)**: Persistente Datenhaltung
- **express-session + better-sqlite3-session-store**: Session-Management
- **bcrypt**: Passwort-Hashing
- **multer**: Datei-Uploads (Audio-Dateien)

### Frontend (React)
- **React 19**: UI-Framework
- **Styled Components**: CSS-in-JS Styling
- **React Router 7**: Navigation
- **Axios**: HTTP-Client
- **Socket.IO Client**: Echtzeit-Updates

### API-Endpunkte
- `GET /api/typen` - Programmpunkt-Typen abrufen
- `GET /api/sitzungen` - Alle Sitzungen abrufen
- `POST /api/sitzung` - Neue Sitzung erstellen
- `GET /api/sitzung/:id` - Sitzung abrufen
- `POST /api/sitzung/:id/programmpunkt` - Programmpunkt hinzufügen
- `PUT /api/sitzung/:id/programmpunkt/:punktId` - Programmpunkt aktualisieren
- `DELETE /api/sitzung/:id/programmpunkt/:punktId` - Programmpunkt löschen
- `POST /api/sitzung/:id/aktiv` - Sitzung aktivieren
- `GET /api/sitzung/:id/aktiv` - Aktive Sitzung abrufen
- `DELETE /api/sitzung/:id` - Sitzung löschen
- `GET /api/sitzung/:id/zettel` - Zettel abrufen
- `POST /api/sitzung/:id/zettel` - Zettel erstellen
- `DELETE /api/sitzung/:id/zettel/:zettelId` - Zettel schließen (Historie bleibt erhalten)
- `POST /api/sitzung/:id/programmpunkt/:punktId/pinboard-audio` - Audio-Datei zum Pinboard hochladen
- `POST /api/auth/login` - Anmeldung mit Passwort
- `POST /api/auth/logout` - Abmeldung
- `GET /api/auth/status` - Authentifizierungsstatus prüfen
- `POST /api/auth/change-password` - Passwort ändern

## 🎨 Design

- **Dunkles Theme**: Schwarzer Hintergrund für bessere Lesbarkeit
- **Farbkodierung**: Verschiedene Farben für verschiedene Informationstypen
- **Responsive**: Funktioniert auf Desktop und Mobile
- **Intuitive Navigation**: Klare Struktur und einfache Bedienung

## 📝 Changelog
### Version 5.2.0 (Aktuell)
- **Passwortschutz**: Authentifizierung für sensible Ansichten (Startseite, Moderation, Technik, Programm-bearbeiten, Drucken)
- **Session-Management**: SQLite-gestützte Sessions mit bcrypt-Passwort-Hashing
- **Audio-Pinboard**: Upload und Wiedergabe von Audio-Dateien mit Waveform-Visualisierung
- **Audio-Persistenz**: Docker bind mount statt named volume für dauerhafte Speicherung
- **Notiz-Titel**: Pinboard-Notizen haben eigene Titel (Standard: "Notiz")
- **Musik-Informationen**: Kulissen-Ansicht zeigt Einzug (→) und Auszug (←) mit farbigen Symbolen
- **Druckansicht-Updates**: Notizen zeigen Titel, Audio-Dateien werden erkannt und dargestellt
- **UX-Verbesserungen**: Navigation während Login zugänglich, bessere Button-Positionierung, Löschbestätigung für Pinboard-Notizen
- **Export/Import**: Sitzungs-Export als ZIP inkl. Audio-Dateien aus Verwaltungsansicht

### Version 5.1.0
- **Neue Elferrat-Ansicht**: Eigene View mit Fokus auf Zettel schreiben + Historie lesen
- **Zettel-Empfänger erweitert**: Unterstützung für `An Kulissen` und `An Küche`
- **Elferrat-Empfangslogik**: Elferrat empfängt wie Moderation, ohne eigenen Empfängertyp
- **Zettel-Sync robuster**: Rejoin/Resync nach Socket-Reconnect plus periodische Fallback-Synchronisierung

### Version 5.0.0
- **Pinboard statt Cues**: Technik-Ansicht und Technik-Druck zeigen Notizzettel pro Programmpunkt; alte Audio-/Licht-Cues entfernt
- **Druck-Optimierung**: Alle Druck-Layouts kompakter für A4; Technik-Druck zeigt nur noch Notizen
- **Dependency-Refresh**: Node 24, Express 5, React 19, React Router 7, uuid 13 (ESM-only), better-sqlite3 12
- **ESM-Server**: server.js und db.js auf ES Modules umgestellt; kompatibel mit Express 5 Routing
- **Docker**: Build auf node:24-bookworm-slim; client/node_modules nach Build entfernt, DB-Volume heißt `picard-data`

### Historie (Auszug)
- 4.3.0: Zeiteingabe auf Minuten umgestellt; einheitliche Zeitdarstellung
- 4.2.0: Server-seitigen PDF-Export entfernt; nur noch Browser-PDF
- 4.1.0: Druck-Layouts (Querformat) und Fußzeile mit Server-URL
- 4.0.0: Vier Druckansichten (Programm, Kulissen, Moderation, Technik)
- 3.0.0: Kulissen-Ansicht, Drag & Drop, Zettel-Historie
- 2.0.0: Live-Zettel-System, Programmansicht, erste Technik-Verbesserungen

## 📄 Lizenz

Dieses Projekt ist unter der **GNU Affero General Public License v3.0 (AGPL-3.0)** lizenziert.

### Was bedeutet das?

- ✅ **Verbreitung erlaubt**: Sie können das Projekt frei nutzen und weiterverbreiten
- ✅ **Forks erlaubt**: Sie können das Projekt forken und modifizieren
- ✅ **Community-Nutzung**: Vereine und Organisationen können es kostenlos nutzen
- ❌ **Keine kommerzielle Nutzung**: Der Code darf nicht in proprietäre Software eingebaut oder verkauft werden
- ✅ **Copyleft**: Alle Derivate müssen ebenfalls unter AGPL-3.0 stehen

### Vollständige Lizenz

Die vollständige AGPL-3.0 Lizenz finden Sie hier: https://www.gnu.org/licenses/agpl-3.0.html

**Wichtig**: Bei Nutzung als Web-Service (wie bei diesem Projekt) müssen auch die Nutzer Zugang zum Quellcode haben.
