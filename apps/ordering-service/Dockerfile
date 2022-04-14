FROM node:16-alpine AS builder
# Set working directory
WORKDIR /app
RUN yarn global add turbo
COPY . .
RUN turbo prune --scope=ordering-service --docker

# Add lockfile and package.json's of isolated subworkspace
FROM node:16-alpine AS installer
WORKDIR /app
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/yarn.lock ./yarn.lock
RUN yarn install

FROM node:16-alpine AS sourcer
WORKDIR /app
COPY --from=installer /app/ .
COPY --from=builder /app/out/full/ .

FROM sourcer as production
RUN yarn turbo run build --scope=ordering-service --include-dependencies --no-deps
CMD [ "yarn", "start" ]