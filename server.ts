import http from 'http'
import path from 'path'
import {PubSub, Message} from '@google-cloud/pubsub'
import {google} from 'googleapis'
import url from 'url'
import axios from 'axios'

const dir = __dirname
let rootDir: string | null = null
if (dir.endsWith('/dist')) {
  rootDir = path.dirname(__dirname)
} else {
  rootDir = __dirname
}
require('dotenv').config({
  path: path.resolve(rootDir, '.env'),
})

const server = http.createServer((req, res) => {
  const {pathname} = url.parse(req.url!)
  if (pathname === '/') {
    res.setHeader('content-type', 'application/json')

    return res.end(JSON.stringify({status: 'ok'}))
  }
})
const port = process.env.PORT || 3000
const auth = new google.auth.GoogleAuth({
  keyFilename: path.resolve(rootDir, 'service_account.json'),
  scopes: ['https://www.googleapis.com/auth/pubsub'],
})

const retries: {[key: string]: number} = {}

const _debug = (...msgs: any[]) => console.log(new Date(), ...msgs)

const sendRequest = async (id: string, data: any) => {
  const retried = retries[id] ?? 0
  _debug('begin send message', {
    id,
    retried,
    data,
  })

  try {
    const resp = await axios.post(process.env.XF_PAYMENT_CALLBACK_URL as string, data, {
      validateStatus: (status) => status >= 200 && status < 400,
      timeout: 30000,
      headers: {
        'content-type': 'text/plain'
      },
      params: {
        '_xfProvider': 'tapi_iap_android',
      },
    })

    _debug('sendRequest OK', resp.data)
  } catch (e) {
    if (axios.isAxiosError(e)) {
      if (e.response?.status && e.response?.status >= 500) {
        _debug('received internal server error. Retrying...')
        if (retried > 5) {
          _debug('too many retried', {id, data})

          return
        }

        Object.assign(retries, {
          ...retries,
          [id]: retried + 1,
        })

        // internal server error
        // retry after 10 seconds
        setTimeout(async () => {
          await sendRequest(id, data)
        }, 10000)
      } else {
        _debug('sendRequest error', {
          status: e.response?.status,
          data: e.response?.data,
          exception: e.toString(),
        })
      }
    } else {
      // internal server error
      _debug('internal server error', e)
    }
  }
}

const runPubSub = async () => {
  const pubsub = new PubSub({
    projectId: process.env.PUBSUB_PROJECT_ID as string,
    auth,
  })

  const subName = process.env.PUBSUB_SUBSCRIPTION_NAME as string
  const topicName = process.env.PUBSUB_TOPIC_NAME as string

  const topic = pubsub.topic(topicName)
  const subscription = topic.subscription(subName)

  subscription.on('message', async (message: Message) => {
    const data = message.data.toString()
    _debug('Received message', {
      id: message.id,
      received: new Date(message.received),
      data,
    })

    await sendRequest(message.id, JSON.stringify({
      message: {
        data: Buffer.from(data).toString('base64')
      }
    }))
  })
}

runPubSub().catch((e) => {
  _debug('runPubSub err', e)
})

server.listen(port, () => {
  console.log(`App started at: http://localhost:${port}`)
})
