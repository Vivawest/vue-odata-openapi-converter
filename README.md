# odata-helper

The app accepts POST requests containing either an OData service URL or raw XML metadata. Optionally, a JSON-formatted string of custom headers can be included. These headers are automatically embedded into the resulting OpenAPI structure.

## Requriements

Node.js and npm (or yarn) installed on your system.

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
