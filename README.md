# PICARD - Programm- & Informations-Center für Ablauf-, Regie- & Moderation

Eine moderne Webanwendung für die professionelle Durchführung von Karnevalssitzungen mit Echtzeit-Kollaboration zwischen Moderation, Technik und Kulissen.

## 🎯 Features

### Moderation-Ansicht
- **Programmablauf**: Übersicht aller Programmpunkte mit Nummerierung
- **Live-Textbearbeitung**: Direkte Bearbeitung von Anmoderation, Notizen und Abmoderation
- **Namensliste**: Personen, die auftreten
- **Statusleiste**: Aktiver Programmpunkt, Einzug/Auszug (CD/Kapelle), Timer
- **Trainer/Betreuer**: Zuständige Personen
- **Live-Zettel**: Kommunikation mit Technik und anderen Ansichten
- **Zettel zu Programmpunkt**: Direkte Umwandlung von Zetteln in Programmpunkte

### Technik-Ansicht
- **Programmablauf**: Übersicht aller Programmpunkte
- **Audio-Informationen**: Welche Dateien abzuspielen sind
- **Licht-Informationen**: Mehrzeilige Eingabe für Lichtdetails
- **Audio-Cues**: Bearbeitbare, zeitgesteuerte Audio-Events
- **Licht-Cues**: Bearbeitbare, zeitgesteuerte Licht-Events
- **Statusleiste**: Aktiver Programmpunkt, Timer, technische Details
- **Live-Zettel**: Kommunikation mit Moderation

### Programmansicht
- **Übersichtliche Darstellung**: Reine Anzeige des Programmablaufs ohne Bearbeitung
- **Live-Zettel**: Erstellung von Zetteln für Moderation und Technik
- **Schwebender Button**: Einfacher Zugang zu Zettel-Funktionen und Historie

### Kulissen-Ansicht
- **Kulissen-Informationen**: Einzug/Auszug von CD oder Kapelle
- **Bühnenaufbau**: Details zu Bütt, Notenständer oder anderen Bühnenrequisiten
- **Live-Zettel**: Kommunikation mit anderen Ansichten
- **Spezielle Anzeige**: Optimiert für Kulissenschieber

### Sitzungsablauf (Mobile)
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
- **Spezielle Ansichten**: Jede Druckoption zeigt relevante Informationen
- **Clientseitige PDF-Generierung**: "Als PDF speichern" über Browser-Druckfunktion

### Timer-Funktionen
- **Automatischer Timer**: Startet automatisch bei Moderation-Auswahl
- **Synchronisation**: Timer zwischen allen Ansichten synchronisiert
- **Live-Timer**: Countdown für Programmpunkte mit Start/Stop/Pause
- **Farbkodierung**: Grün → Gelb → Rot je nach verbleibender Zeit
- **Aktiver Programmpunkt**: Blinkende Markierung

### Live-Zettel-System
- **Bidirektionale Kommunikation**: Zwischen allen Ansichten
- **Prioritätsstufen**: Normal, Wichtig, Dringend mit Farbkodierung
- **Zettel-Typen**: An Moderation, An Technik, An Alle
- **Zettel-Historie**: Alle vergangenen Zettel einsehbar
- **Zettel schließen**: Statt löschen werden Zettel als "geschlossen" markiert
- **Echtzeit-Updates**: Sofortige Anzeige neuer Zettel

### Echtzeit-Funktionen
- **Socket.IO**: Live-Updates zwischen allen verbundenen Clients
- **Multi-User**: Mehrere Benutzer können gleichzeitig arbeiten
- **Automatisches Speichern**: Änderungen werden automatisch gespeichert

## 🗄️ Datenhaltung

**Wichtig:** Aktuell werden alle Daten im Arbeitsspeicher (In-Memory) gehalten. Das bedeutet:
- **Daten gehen beim Neustart des Servers verloren!**
- Für produktive Nutzung sollte eine echte Datenbank ergänzt werden.

## 🚀 Installation & Betrieb

### Docker (empfohlen)
```bash
# Container starten
docker-compose up -d

# Anwendung öffnen
# http://localhost:5000
```

### Lokale Installation
```bash
# Dependencies installieren
npm install
cd client && npm install && cd ..

# Server starten
node server.js
```

## 📱 Verwendung

1. Anwendung im Browser öffnen (`http://localhost:5000`)
2. "Neue Sitzung erstellen" klicken und Namen vergeben
3. Sitzung aktivieren und Programmpunkte verwalten
4. Verschiedene Ansichten nutzen:
   - **Moderation**: Für die Moderation während der Sitzung
   - **Technik**: Für die Bühnentechnik
   - **Programmansicht**: Für Zuschauer und Übersicht
   - **Kulissen**: Für Kulissenschieber
   - **Sitzungsablauf**: Für mobile Eingaben
   - **Programm bearbeiten**: Für die Bearbeitung bestehender Programmpunkte
   - **Drucken**: Für professionelle Drucklayouts aller Ansichten

## 🏗️ Architektur

### Backend (Node.js/Express)
- **Express.js**: Web-Framework
- **Socket.IO**: Echtzeit-Kommunikation
- **In-Memory Storage**: Für Entwicklung

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
- `GET /api/sitzung/:id/aktiv` - Aktive Sitzung abrufen
- `DELETE /api/sitzung/:id` - Sitzung löschen
- `GET /api/sitzung/:id/zettel` - Zettel abrufen
- `POST /api/sitzung/:id/zettel` - Zettel erstellen
- `DELETE /api/sitzung/:id/zettel/:zettelId` - Zettel löschen

## 🎨 Design

- **Dunkles Theme**: Schwarzer Hintergrund für bessere Lesbarkeit
- **Farbkodierung**: Verschiedene Farben für verschiedene Informationstypen
- **Responsive**: Funktioniert auf Desktop und Mobile
- **Intuitive Navigation**: Klare Struktur und einfache Bedienung

## 📝 Changelog

### Version 4.2.0 (Aktuell)
- **Entfernung server-seitiger PDF-Export**: Stabilitätsverbesserung durch Entfernung problematischer Puppeteer-Abhängigkeiten
- **Clientseitige PDF-Generierung**: Nur noch Browser-basierte PDF-Export-Funktion
- **Vereinfachte Architektur**: Weniger Dependencies und kleinere Container-Größe
- **Schnellere Builds**: Entfernung von Chrome-Installation im Docker-Container

### Version 4.1.0
- **Erweiterte Drucken-Funktionalität**: Querformat für Kulissen, Moderation und Technik
- **Jahreszahl in Überschriften**: Automatische Einbindung des aktuellen Jahres
- **Fußzeile mit Server-URL**: Professionelle Fußzeile mit Live-Programm-Hinweis
- **Optimierte Layouts**: Bessere Platznutzung und professionelle Gestaltung
- **Programmansicht ohne Untertitel**: Saubere Übersicht ohne zusätzliche Beschriftung

### Version 4.0.0
- **Drucken-Funktionalität**: Vier professionelle Drucklayouts für alle Ansichten
- **Programmansicht-Druck**: Übersichtliches Layout ohne zusätzliche Details
- **Kulissen-Druck**: Mit Einzug/Auszug und Bühneninformationen
- **Moderation-Druck**: Mit allen Moderation-Informationen und Namenslisten
- **Technik-Druck**: Mit Audio- und Licht-Cues für die Technik
- **PDF-Export**: Möglichkeit zum Speichern als PDF über Browser-Druckfunktion

### Version 3.0.0
- **Kulissen-Ansicht**: Neue Ansicht für Kulissenschieber mit Bühneninformationen
- **Drag & Drop**: Reihenfolge-Änderung in "Programm bearbeiten"
- **Zettel-Historie**: Alle vergangenen Zettel einsehbar
- **Verbesserte Zettel-Logik**: Korrekte Filterung und Sichtbarkeit
- **Bühneninformationen**: Neues Feld für Bühnenaufbau
- **Einzug/Auszug-Anzeige**: "Von CD" vs "Von Kapelle"

### Version 2.0.0
- **Live-Zettel-System**: Bidirektionale Kommunikation
- **Programmansicht**: Neue Ansicht für Zuschauer
- **Verbesserte Technik-Ansicht**: Mehrzeilige Licht-Informationen

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert.


