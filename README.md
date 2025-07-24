# Sitzungsmaster Web

Eine moderne Webanwendung für digitale Moderationskarten bei Karnevalssitzungen. Diese Anwendung ersetzt das ursprüngliche Java-Desktop-Programm und bietet erweiterte Funktionen für Echtzeit-Kollaboration.

## 🎯 Features

### Moderator-Ansicht
- **Programmablauf**: Übersicht aller Programmpunkte (links)
- **Anmoderation**: Direkte Bearbeitung der Anmoderation (oben Mitte)
- **Notizen**: Bearbeitbare Notizen (Mitte)
- **Abmoderation**: Direkte Bearbeitung der Abmoderation (unten Mitte)
- **Namensliste**: Personen die auftreten (rechts)
- **Statusleiste**: Aktiver Programmpunkt, Einzug/Auszug (CD/Kapelle)
- **Trainer/Betreuer**: Zuständige Personen (rechts unten)
- **Live-Bearbeitung**: Texte können während der Sitzung angepasst werden

### Techniker-Ansicht
- **Audio-Dateien**: Welche Dateien abzuspielen sind
- **Lichtstimmung**: Gewünschte Lichtstimmung (Standard, Warm, Kalt, Dramatisch, Party)
- **Audio-Cues**: Bearbeitbare, zeitgesteuerte Audio-Events
- **Licht-Cues**: Bearbeitbare, zeitgesteuerte Licht-Events
- **Dauer-Anzeige**: Geschätzte Dauer des Programmpunkts
- **Live-Cue-Management**: Cues können während der Sitzung hinzugefügt/geändert werden

### Programmpunkt Editor (Desktop)
- **Vollständige Eingabe**: Alle Felder für komplette Programmpunkte
- **Quick-Actions**: Vorlagen für häufige Programmpunkt-Typen (Büttenrede, Marsch, etc.)
- **Namensliste-Management**: Einfaches Hinzufügen/Entfernen von Namen
- **Benutzerfreundlich**: Übersichtliches Formular mit Validierung

### Sitzungsablauf (Smartphone)
- **Mobile-optimiert**: Übersichtliche Darstellung des Programmablaufs
- **Live-Einfügung**: Neue Programmpunkte an beliebigen Positionen
- **Moderation-Typ**: Standardmäßig vom Typ "Moderation" mit 5 Minuten Dauer
- **Einfache Eingabe**: Nur Name, Dauer und Notizen bearbeitbar
- **Positionierung**: Einfügen vor/nach beliebigen Programmpunkten

### Timer-Funktionen
- **Automatischer Timer**: Startet automatisch bei Moderator-Auswahl eines Programmpunkts
- **Synchronisation**: Timer ist zwischen Moderator und Techniker synchronisiert
- **Live-Timer**: Countdown für Programmpunkte mit Start/Stop/Pause
- **Aktuelle Uhrzeit**: Echtzeit-Anzeige in der Navigation
- **Fortschrittsbalken**: Visueller Fortschritt des Timers
- **Browser-Benachrichtigungen**: Warnungen bei 75% und 90% der Zeit
- **Audio-Benachrichtigungen**: Signalton beim Ablaufen des Timers
- **Farbkodierung**: Grün → Gelb → Rot je nach verbleibender Zeit
- **Aktiver Programmpunkt**: Blinkende Markierung des aktuellen Programmpunkts
- **Mobile Filterung**: Zeigt nur aktuelle und zukünftige Programmpunkte

### Echtzeit-Funktionen
- **Socket.IO**: Live-Updates zwischen allen verbundenen Clients
- **Multi-User**: Mehrere Benutzer können gleichzeitig arbeiten
- **Aktive Sitzung**: Zentrale Verwaltung der aktiven Sitzung

## 🚀 Installation

### Option 1: Docker (Empfohlen)

#### Voraussetzungen
- Docker Desktop für Windows installiert
- Docker Compose verfügbar

#### Schnellstart mit Docker
```bash
# Container starten
docker-compose up -d

# Anwendung öffnen
# http://localhost:5000
```

#### Docker Management Script (Windows)
```bash
# Verwenden Sie das mitgelieferte Script
docker-run.bat
```

#### Manuelle Docker-Befehle
```bash
# Container starten
docker-compose up -d

# Container stoppen
docker-compose down

# Logs anzeigen
docker-compose logs -f

# Container neu starten
docker-compose restart

# Container und Images löschen
docker-compose down --rmi all --volumes
```

#### Docker Management Script (Windows)
```bash
# Verwenden Sie das mitgelieferte Script
docker-run.bat
```

#### Manuelle Docker-Befehle
```bash
# Container starten
docker-compose up -d

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

#### Automatisches Setup (Windows)
```bash
# Verwenden Sie das Build-Script
build-frontend.bat
```

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

**Hinweis**: Im Entwicklungsmodus läuft das Frontend auf `http://localhost:3000` und das Backend auf `http://localhost:5000`. Der React Development Server leitet API-Aufrufe automatisch an das Backend weiter.

#### Vollständige Installation
```bash
# Alle Dependencies installieren
npm install
npm run install-client

# Entwicklungsserver starten
npm run dev
```

## 📱 Verwendung

### 1. Sitzung erstellen
- Öffnen Sie die Anwendung im Browser
- Klicken Sie auf "Neue Sitzung erstellen"
- Geben Sie einen Namen für die Sitzung ein

### 2. Sitzung aktivieren
- Wählen Sie eine Sitzung aus der Liste aus
- Die Sitzung wird automatisch aktiviert

### 3. Moderator-Ansicht
- Navigieren Sie zur "Moderator"-Ansicht
- Wählen Sie einen Programmpunkt aus der linken Liste
- Alle Informationen werden in Echtzeit angezeigt

### 4. Techniker-Ansicht
- Navigieren Sie zur "Techniker"-Ansicht
- Technische Details werden für den ausgewählten Programmpunkt angezeigt

### 5. Mobile Eingabe
- Öffnen Sie die "Mobile Input"-Ansicht auf einem Smartphone
- Füllen Sie das Formular aus
- Der neue Programmpunkt wird sofort allen Ansichten hinzugefügt

## 🏗️ Architektur

### Backend (Node.js/Express)
- **Express.js**: Web-Framework
- **Socket.IO**: Echtzeit-Kommunikation
- **In-Memory Storage**: Für Entwicklung (kann durch echte DB ersetzt werden)

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

## 🎨 Design

Das Design orientiert sich am ursprünglichen Java-Programm:
- **Dunkles Theme**: Schwarzer Hintergrund für bessere Lesbarkeit
- **Farbkodierung**: Verschiedene Farben für verschiedene Informationstypen
- **Responsive**: Funktioniert auf Desktop und Mobile
- **Intuitive Navigation**: Klare Struktur und einfache Bedienung

## 🔧 Konfiguration

### Umgebungsvariablen
```bash
PORT=5000                    # Server-Port (Standard: 5000)
NODE_ENV=development         # Umgebung (development/production)
```

### Anpassungen
- **Programmpunkt-Typen**: In `server.js` unter `TYPEN` anpassen
- **Lichtstimmungen**: In `TechnikerView.js` unter `LightPreset` erweitern
- **Styling**: Über `styled-components` in den jeweiligen Komponenten

## 🚀 Deployment

### Heroku
```bash
# Heroku-App erstellen
heroku create sitzungsmaster-web

# Deploy
git push heroku main
```

### Docker
```bash
# Mit Docker Compose (empfohlen)
docker-compose up -d

# Oder manuell mit Dockerfile
docker build -t sitzungsmaster-web .
docker run -p 5000:5000 sitzungsmaster-web
```

#### Docker Compose Services
- **sitzungsmaster**: Hauptanwendung mit React-Frontend und Express-Backend
- **Port**: 5000 (http://localhost:5000)
- **Health Check**: Automatische Überprüfung der Anwendung
- **Restart Policy**: Automatischer Neustart bei Fehlern

## 📝 Changelog

### Version 1.0.0
- Initiale Web-Implementierung
- Moderator-Ansicht
- Techniker-Ansicht
- Mobile Input
- Echtzeit-Updates
- Responsive Design

## 🤝 Beitragen

1. Fork das Repository
2. Erstellen Sie einen Feature-Branch (`git checkout -b feature/AmazingFeature`)
3. Committen Sie Ihre Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. Pushen Sie zum Branch (`git push origin feature/AmazingFeature`)
5. Öffnen Sie einen Pull Request

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert - siehe [LICENSE](LICENSE) Datei für Details.

## 👨‍💻 Autor

**Jannis Rösner** - *Ursprünglicher Java-Entwickler*
- Web-Implementierung basierend auf dem ursprünglichen Java-Programm

## 🙏 Danksagungen

- Basierend auf dem ursprünglichen Java-Programm "Sitzungsmaster"
- Inspiriert von der Notwendigkeit für moderne Web-Technologien
- Unterstützt durch die Karnevals-Community 