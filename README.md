# xenapp-pubsub-node

## Setup

Create new file `.env` and save it save level with file `server.ts`

ENV must be have these keys

```
PUBSUB_PROJECT_ID=
PUBSUB_TOPIC_NAME=
PUBSUB_SUBSCRIPTION_NAME=

XF_PAYMENT_CALLBACK_URL=
```

- PUBSUB_PROJECT_ID: Google Cloud Pub/Sub ID
- PUBSUB_TOPIC_NAME: Google Cloud Pub/Sub topic name
- PUBSUB_SUBSCRIPTION_NAME: Google Cloud Pub/Sub subscripion name

- XF_PAYMENT_CALLBACK_URL: The URL point to payment_callback.php. Eg: http://localhost/payment_callback.php?_xfProvider=xxx

You will need download the Google Account Service JSON and save it same level with file `server.ts`.
The Account Service JSON must be named: `account_service.json`

Finally your structure will be like (skip this step if you're using docker)

```
...other files
.env
service_account.json
server.ts
...other files
```

## Docker

```
docker run -d -p 3001:300 -v "/path/file/to/.env:/app/.env" \
  -v "/path/file/to/service_account.json:/app/service_account.json" \
  luutruong/xenapp-pubsub-node:latest
```

## Without docker

```bash
git pull https://github.com/luutruong/xenapp-pubsub-node.git
cd xenapp-pubsub-node
yarn install --frozen-lockfile --ignore-scripts
yarn build

pm2 start yarn --name xenapp-pubsub-node -- start
```

note: You will need install pm2 at the global packages

`npm install -g pm2` OR `yarn add -g pm2`
