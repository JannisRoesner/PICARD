# PICARD - Programm- & Informations-Center für Ablauf-, Regie- & Moderation

Eine moderne Webanwendung für die professionelle Durchführung von Karnevalssitzungen und Veranstaltungen mit erweiterten Funktionen für Echtzeit-Kollaboration zwischen Moderation und Technik.

## 🎯 Features

### Moderator-Ansicht
- **Programmablauf**: Übersicht aller Programmpunkte mit Nummerierung (links)
- **Live-Textbearbeitung**: Direkte Bearbeitung von Anmoderation, Notizen und Abmoderation
- **Namensliste**: Personen, die auftreten (rechts)
- **Statusleiste**: Aktiver Programmpunkt, Einzug/Auszug (CD/Kapelle), Timer
- **Trainer/Betreuer**: Zuständige Personen (rechts unten)
- **Live-Zettel**: Kommunikation mit Technik und Programmansicht
- **Zettel zu Programmpunkt**: Direkte Umwandlung von Zetteln in Programmpunkte

### Techniker-Ansicht
- **Programmablauf**: Übersicht aller Programmpunkte (links)
- **Audio-Informationen**: Welche Dateien abzuspielen sind
- **Licht-Informationen**: Mehrzeilige Eingabe für Lichtdetails
- **Audio-Cues**: Bearbeitbare, zeitgesteuerte Audio-Events
- **Licht-Cues**: Bearbeitbare, zeitgesteuerte Licht-Events
- **Statusleiste**: Aktiver Programmpunkt, Timer, technische Details
- **Live-Zettel**: Kommunikation mit Moderation

### Programmansicht (Mobile)
- **Mobile-optimiert**: Übersichtliche Darstellung des Programmablaufs
- **Live-Zettel**: Erstellung von Zetteln für Moderation und Technik
- **Schwebender Button**: Einfacher Zugang zu Zettel-Funktionen
- **Echtzeit-Updates**: Sofortige Anzeige von Änderungen

### Programmpunkt Editor (Desktop)
- **Vollständige Eingabe**: Alle Felder für komplette Programmpunkte
- **Namensliste-Management**: Einfaches Hinzufügen/Entfernen von Namen
- **Benutzerfreundlich**: Übersichtliches Formular mit Validierung

### Sitzungsablauf (Mobile Input)
- **Mobile-optimiert**: Übersichtliche Darstellung des Programmablaufs
- **Live-Einfügung**: Neue Programmpunkte an beliebigen Positionen
- **Moderation-Typ**: Standardmäßig vom Typ "Moderation" mit 5 Minuten Dauer
- **Einfache Eingabe**: Nur Name, Dauer und Notizen bearbeitbar
- **Positionierung**: Einfügen vor/nach beliebigen Programmpunkten
- **Live-Zettel**: Erstellung von Zetteln für alle Beteiligten

### Timer-Funktionen
- **Automatischer Timer**: Startet automatisch bei Moderator-Auswahl eines Programmpunkts
- **Synchronisation**: Timer ist zwischen Moderator und Techniker synchronisiert
- **Live-Timer**: Countdown für Programmpunkte mit Start/Stop/Pause
- **Aktuelle Uhrzeit**: Echtzeit-Anzeige in der Navigation
- **Fortschrittsbalken**: Visueller Fortschritt des Timers
- **Farbkodierung**: Grün → Gelb → Rot je nach verbleibender Zeit
- **Aktiver Programmpunkt**: Blinkende Markierung des aktuellen Programmpunkts

### Live-Zettel-System
- **Bidirektionale Kommunikation**: Zwischen Moderation und Technik
- **Prioritätsstufen**: Normal, Wichtig, Dringend mit Farbkodierung
- **Zettel-Typen**: An Moderation, An Technik, An Alle
- **Echtzeit-Updates**: Sofortige Anzeige neuer Zettel
- **Zettel zu Programmpunkt**: Direkte Umwandlung in der Moderator-Ansicht
- **Zeitstempel**: Automatische Zeitmarkierung aller Zettel
- **Blink-Animation**: Für neue Zettel zur besseren Aufmerksamkeit

### Echtzeit-Funktionen
- **Socket.IO**: Live-Updates zwischen allen verbundenen Clients
- **Multi-User**: Mehrere Benutzer können gleichzeitig arbeiten
- **Aktive Sitzung**: Zentrale Verwaltung der aktiven Sitzung
- **Automatisches Speichern**: Änderungen werden automatisch gespeichert

## 🗄️ Datenhaltung

**Wichtig:** Aktuell werden alle Daten ausschließlich im Arbeitsspeicher (In-Memory) des Servers gehalten. Das bedeutet:
- **Daten gehen beim Neustart des Servers verloren!**
- Es ist keine externe Datenbank angebunden.
- Für produktive Nutzung oder dauerhafte Speicherung sollte eine echte Datenbank (z.B. MongoDB oder PostgreSQL) ergänzt werden.

## 🚀 Installation & Betrieb

### Option 1: Docker (empfohlen)

#### Voraussetzungen
- Docker Desktop für Windows installiert
- Docker Compose verfügbar

#### Schnellstart
```bash
# Container starten
docker-compose up -d

# Anwendung öffnen
# http://localhost:5000
```

#### Wichtige Docker-Befehle
```bash
# Container stoppen
docker-compose down

# Logs anzeigen
docker-compose logs -f

# Container neu starten
docker-compose restart

# Container und Images löschen
docker-compose down --rmi all --volumes
```

### Option 2: Lokale Installation

#### Voraussetzungen
- Node.js (Version 14 oder höher)
- npm oder yarn

#### Manuelles Setup
```bash
# Backend Dependencies installieren
npm install

# Frontend Dependencies installieren und bauen
cd client
npm install
npm run build
cd ..

# Server starten
node server.js
```

#### Entwicklungsserver (Alternative)
```bash
# Backend starten
node server.js

# In einem neuen Terminal: Frontend starten
cd client
npm start
```

## 📱 Verwendung

1. Anwendung im Browser öffnen (`http://localhost:5000`)
2. "Neue Sitzung erstellen" klicken und Namen vergeben
3. Sitzung aktivieren und Programmpunkte verwalten
4. Verschiedene Ansichten nutzen:
   - **Moderator**: Für die Moderation während der Sitzung
   - **Techniker**: Für die Bühnentechnik
   - **Programmansicht**: Für Zuschauer und schnelle Zettel
   - **Sitzungsablauf**: Für mobile Eingaben
   - **Programmpunkt Editor**: Für detaillierte Programmpunkt-Erstellung

## 🏗️ Architektur

### Backend (Node.js/Express)
- **Express.js**: Web-Framework
- **Socket.IO**: Echtzeit-Kommunikation
- **In-Memory Storage**: Für Entwicklung (Datenverlust bei Neustart)

### Frontend (React)
- **React 18**: UI-Framework
- **Styled Components**: CSS-in-JS Styling
- **React Router**: Navigation
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
- `GET /api/aktive-sitzung` - Aktive Sitzung abrufen
- `GET /api/sitzung/:id/zettel` - Zettel abrufen
- `POST /api/sitzung/:id/zettel` - Zettel erstellen
- `DELETE /api/sitzung/:id/zettel/:zettelId` - Zettel löschen

## 🎨 Design

- **Dunkles Theme**: Schwarzer Hintergrund für bessere Lesbarkeit
- **Farbkodierung**: Verschiedene Farben für verschiedene Informationstypen
- **Responsive**: Funktioniert auf Desktop und Mobile
- **Intuitive Navigation**: Klare Struktur und einfache Bedienung
- **Live-Zettel**: Auffällige Darstellung mit Prioritätsfarben

## 🔧 Konfiguration

### Umgebungsvariablen
```bash
PORT=5000                    # Server-Port (Standard: 5000)
NODE_ENV=development         # Umgebung (development/production)
```

### Anpassungen
- **Programmpunkt-Typen**: In `server.js` unter `TYPEN` anpassen
- **Licht-Informationen**: In `TechnikerView.js` unter `CueTextarea` erweitern
- **Styling**: Über `styled-components` in den jeweiligen Komponenten

## 🚀 Deployment

### Docker
```bash
# Mit Docker Compose (empfohlen)
docker-compose up -d

# Oder manuell mit Dockerfile
docker build -t picard-web .
docker run -p 5000:5000 picard-web
```

## 📝 Changelog

### Version 2.0.0 (Aktuell)
- **Live-Zettel-System**: Bidirektionale Kommunikation zwischen Moderation und Technik
- **Programmansicht**: Neue Ansicht für Zuschauer und Zettel-Erstellung
- **Verbesserte Techniker-Ansicht**: Mehrzeilige Licht-Informationen
- **Zettel zu Programmpunkt**: Direkte Umwandlung in der Moderator-Ansicht
- **Erweiterte Navigation**: Neue Menüpunkte und bessere Struktur
- **Verbesserte UI**: Kleinere Schriftgrößen und optimierte Layouts

### Version 1.0.0
- Initiale Web-Implementierung
- Moderator-Ansicht
- Techniker-Ansicht
- Mobile Input
- Echtzeit-Updates
- Responsive Design

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert.


