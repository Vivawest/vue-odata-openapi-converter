# odata-helper

The app accepts POST requests containing either an OData service URL or raw XML metadata. Optionally, a JSON-formatted string of custom headers can be included. These headers are automatically embedded into the resulting OpenAPI structure.

## Requriements

Node.js and npm (or yarn) installed on your system.

For running the app inside a Docker container, you need to have Docker (and Docker-Compose) installed.

If you use Docker-Compose you have to copy the `.env.example` to a `.env`-File and configure the ports as needed.

## Project Setup

```sh
npm install
```

### Running the Server

```sh
npm run dev:server
```

The server automatically listens on the next available free port.

### Compile and Hot-Reload for Frontend

```sh
npm run dev:frontend
```

### Running Both Server and Frontend

```sh
npm run dev
```

### Build and run in docker container
```sh
# 1. App-Container bauen und starten (ggf. Port anpassen)
docker build -t odata-openapi-converter-server-image -f infrastructure/backend/Dockerfile .
docker run -d --name app -p 3000:3000 odata-openapi-converter-server-image

# 2. nginx-Proxy starten (nachdem app läuft, ggf. Port anpassen)
docker build -t odata-openapi-converter-nginx-proxy-image -f infrastructure/frontend/Dockerfile .
docker run -d \
  --name nginx-proxy \
  --link app \
  -p 8080:8080 \
  odata-openapi-converter-nginx-proxy-image
```

### Or simply run the docker-compose file
```sh
docker-compose up -d
```

## Run using pre-built images from GHCR (docker-compose)

If you don't want to build images locally, you can run the published images from **GitHub Container Registry (GHCR)**.

> If the packages are **Public**, no `docker login` is required.

Create a `docker-compose.yml` like this (optionally add the tag):

```yaml
services:
  app:
    image: ghcr.io/Vivawest/vue-odata-openapi-converter-backend:latest
    ports:
      - "3000:3000"

  nginx-proxy:
    image: ghcr.io/Vivawest/vue-odata-openapi-converter-frontend:latest
    ports:
      - "8080:8080"
    depends_on:
      - app
```

Start it:

```sh
docker compose up -d
```

Then open:

- Frontend: http://localhost:8080
- Backend: http://localhost:3000

## Local CI / GitHub Actions testing

If you want to run the Docker GitHub Actions workflow locally (e.g. before changing the release pipeline), see [`docs/local-github-actions-testing.md`](docs/local-github-actions-testing.md).
