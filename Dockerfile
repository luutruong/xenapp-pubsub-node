ARG BASE_IMAGE=node:18.11-alpine

FROM ${BASE_IMAGE} as deps

WORKDIR /app

COPY package.json .
COPY yarn.lock .

RUN yarn install --frozen-lockfile --ignore-scripts

FROM ${BASE_IMAGE} as builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn build

FROM ${BASE_IMAGE} as runner

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json .
COPY yarn.lock .

ENV PORT=3000
ENV NODE_ENV=production

CMD ["yarn", "start"]