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
