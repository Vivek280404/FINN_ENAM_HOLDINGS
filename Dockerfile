FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY scripts/build.mjs scripts/build.mjs
COPY worker worker
COPY web web
COPY src src
COPY drizzle drizzle
COPY .openai/hosting.json .openai/hosting.json
RUN npm run build

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4173 DATA_DIR=/data
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/drizzle ./drizzle
COPY package.json ./package.json
COPY scripts/serve.mjs ./scripts/serve.mjs
COPY src/standalone.js src/remote-database.js ./src/
RUN mkdir /data && chown node:node /data
USER node
EXPOSE 4173
VOLUME ["/data"]
HEALTHCHECK --interval=30s --timeout=3s CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "scripts/serve.mjs"]
