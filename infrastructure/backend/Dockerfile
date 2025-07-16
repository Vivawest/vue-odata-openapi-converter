FROM node:24-alpine AS build-stage
WORKDIR /app
COPY package*.json ./
COPY tsconfig*.json ./
COPY ../.. .
RUN npm install
RUN npm run build:server
RUN npm run build

FROM node:24-alpine AS production-stage
WORKDIR /app
COPY --from=build-stage /app/build ./build
COPY --from=build-stage /app/dist ./dist
COPY --from=build-stage /app/node_modules ./node_modules
RUN npm install -g odata-openapi && odata-openapi3 --version # Install odata-openapi globally for OData to OpenAPI conversion
# RUN apk add --no-cache net-tools curl # Uncomment if you need net-tools or curl for debugging
RUN chmod -R 755 build # Ensure build directory is executable
EXPOSE 3000
CMD ["node", "build/server.js"]

# Useful debugging commands insde the container:
# netstat -tuln # to check if the server is running
# curl -X POST http://localhost:3000/api/convert-to-openapi -H "Content-Type: application/json" -d '{"xmlData":"<root></root>"}' # to test the OData conversion endpoint inside the container
