import fetch from 'node-fetch'

const mongoDatabase = process.env.MONGO_DB
const mongoCluster = process.env.MONGO_CLUSTER
const mongoEndpoint = process.env.MONGO_ENDPOINT
const mongoApiKey = process.env.MONGO_API_KEY

export default async (action, collection, options) => {
    options.database = mongoDatabase
    options.dataSource = mongoCluster
    options.collection = collection

    const response = await fetch(`${mongoEndpoint}/action/${action}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Request-Headers': '*',
            'api-key': mongoApiKey
        },
        body: JSON.stringify(options)
    })

    if (!response.ok) {
        throw new Error(`MongoDB error: ${response.status}`)
    }

    return await response.json()
}