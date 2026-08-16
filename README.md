# Cart Scheduler — frontend

Frontend React + TypeScript + Vite komunikujący się z backendem Spring.

## Docker Compose

Projekt używa jednego pliku `compose.yaml` z profilami `dev` i `prod`.
Backend powinien działać na hoście na porcie `8080`.

### DEV

```sh
docker compose --profile dev up -d --build
```

Aplikacja będzie dostępna pod `http://localhost:5173`. Kod projektu jest
zamontowany w kontenerze, a Vite HMR automatycznie odświeża zmiany.
Polling plików jest włączony jawnie, dzięki czemu obserwowanie zmian działa
również z bind mountami Docker Desktop na Windowsie.

```sh
docker compose --profile dev logs -f
docker compose --profile dev stop
docker compose --profile dev start
docker compose --profile dev down
```

Po zmianie konfiguracji Compose lub Dockerfile odtwórz kontener:

```sh
docker compose --profile dev down
docker compose --profile dev up -d --build --force-recreate
```

Po zmianie `package.json` lub `package-lock.json` odtwórz również wolumen
z zależnościami:

```sh
docker compose --profile dev down -v
docker compose --profile dev up -d --build
```

### PROD

```sh
docker compose --profile prod up -d --build
```

Produkcyjny build jest serwowany przez Nginx pod `http://localhost:3000`.
Kontener używa polityki `restart: unless-stopped`.

```sh
docker compose --profile prod logs -f
docker compose --profile prod stop
docker compose --profile prod start
docker compose --profile prod down
```

`stop` zatrzymuje kontener bez usuwania go. `down` usuwa kontener oraz sieć
Compose, ale pozostawia zbudowany obraz.

Przed przełączeniem profilu zatrzymaj poprzednie środowisko, na przykład:

```sh
docker compose --profile dev down
docker compose --profile prod up -d --build
```

## Uruchomienie lokalne bez Dockera

```sh
npm ci
npm run dev
```

Vite przekazuje wtedy żądania `/api/*` do `http://127.0.0.1:8080`.

## Konfiguracja backendu

W obu profilach żądania `/api/*` są przekazywane do
`http://host.docker.internal:8080`. Adres można zmienić w `compose.yaml`:

- DEV: `VITE_BACKEND_URL`,
- PROD: `BACKEND_URL`.

W profilu produkcyjnym zmiana `BACKEND_URL` nie wymaga ponownego budowania
obrazu.
