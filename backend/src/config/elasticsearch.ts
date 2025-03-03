// src/config/elasticsearch.ts
import { Client } from '@elastic/elasticsearch'

const client = new Client({
    node: 'http://elasticsearch:9200',
    maxRetries: 3,
    requestTimeout: 10000, // 10秒超時
    pingTimeout: 5000       // ping超時5秒
})

export default client;