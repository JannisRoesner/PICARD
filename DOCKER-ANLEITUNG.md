# 🐳 Docker-Anleitung für Sitzungsmaster

## Schnellstart

### 1. Docker Desktop installieren
- Laden Sie [Docker Desktop für Windows](https://www.docker.com/products/docker-desktop/) herunter
- Installieren Sie Docker Desktop
- Starten Sie Docker Desktop und warten Sie, bis es vollständig geladen ist

### 2. Anwendung starten
```bash
# Im Projektverzeichnis
docker-compose up -d
```

### 3. Anwendung öffnen
Öffnen Sie Ihren Browser und gehen Sie zu:
```
http://localhost:5000
```

## 🎯 Erste Schritte

1. **Sitzung erstellen**
   - Klicken Sie auf "Neue Sitzung erstellen"
   - Geben Sie einen Namen ein (z.B. "Karnevalssitzung 2024")

2. **Sitzung aktivieren**
   - Klicken Sie auf die erstellte Sitzung
   - Sie wird automatisch aktiviert

3. **Programmpunkte hinzufügen**
   - Gehen Sie zur "Mobile Input"-Ansicht
   - Füllen Sie das Formular aus
   - Der Programmpunkt erscheint sofort in allen Ansichten

4. **Moderator-Ansicht testen**
   - Gehen Sie zur "Moderator"-Ansicht
   - Wählen Sie einen Programmpunkt aus der linken Liste
   - Alle Informationen werden angezeigt

5. **Techniker-Ansicht testen**
   - Gehen Sie zur "Techniker"-Ansicht
   - Technische Details werden angezeigt

## 🔧 Docker-Befehle

### Container verwalten
```bash
# Container starten
docker-compose up -d

# Container stoppen
docker-compose down

# Container neu starten
docker-compose restart

# Container-Status anzeigen
docker-compose ps

# Logs anzeigen
docker-compose logs -f
```

### Container löschen
```bash
# Container und Images löschen
docker-compose down --rmi all --volumes

# Nur Container löschen (Images bleiben)
docker-compose down
```

### Troubleshooting
```bash
# Container-Logs anzeigen
docker-compose logs sitzungsmaster

# Container neu bauen
docker-compose build --no-cache

# Container-Status prüfen
docker-compose ps
docker-compose exec sitzungsmaster curl -f http://localhost:5000/api/typen
```

## 📱 Mobile Testing

### Smartphone-Test
1. Finden Sie die IP-Adresse Ihres Computers:
   ```bash
   ipconfig
   ```
   (Suchen Sie nach "IPv4-Adresse", z.B. 192.168.1.100)

2. Öffnen Sie auf Ihrem Smartphone:
   ```
   http://192.168.1.100:5000
   ```

3. Gehen Sie zur "Mobile Input"-Ansicht und testen Sie die Eingabe

### Browser-Test
- **Chrome/Edge**: http://localhost:5000
- **Firefox**: http://localhost:5000
- **Safari**: http://localhost:5000

## 🚨 Häufige Probleme

### Port 5000 bereits belegt
```bash
# Prüfen Sie, was Port 5000 verwendet
netstat -ano | findstr :5000

# Stoppen Sie den anderen Service oder ändern Sie den Port in docker-compose.yml
```

### Docker Desktop nicht gestartet
- Starten Sie Docker Desktop
- Warten Sie, bis das Docker-Symbol grün wird

### Container startet nicht
```bash
# Logs prüfen
docker-compose logs sitzungsmaster

# Container neu bauen
docker-compose build --no-cache
docker-compose up -d
```

### Anwendung nicht erreichbar
1. Prüfen Sie, ob der Container läuft:
   ```bash
   docker-compose ps
   ```

2. Prüfen Sie die Logs:
   ```bash
   docker-compose logs sitzungsmaster
   ```

3. Testen Sie die API direkt:
   ```bash
   curl http://localhost:5000/api/typen
   ```

## 🎉 Erfolgreich getestet!

Wenn alles funktioniert, sollten Sie:
- ✅ Die Anwendung unter http://localhost:5000 öffnen können
- ✅ Eine Sitzung erstellen können
- ✅ Programmpunkte hinzufügen können
- ✅ Alle drei Ansichten (Moderator, Techniker, Mobile) nutzen können
- ✅ Echtzeit-Updates zwischen verschiedenen Browser-Tabs sehen können

## 📞 Support

Bei Problemen:
1. Prüfen Sie die Docker-Logs: `docker-compose logs sitzungsmaster`
2. Stellen Sie sicher, dass Docker Desktop läuft
3. Prüfen Sie, ob Port 5000 frei ist
4. Versuchen Sie einen Neustart: `docker-compose restart` 