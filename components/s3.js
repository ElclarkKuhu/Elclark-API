import S3 from 'aws-sdk/clients/s3.js'

const accessKeyId = process.env.S3_KEY
const secretAccessKey = process.env.S3_SECRET
const endpoint = process.env.S3_ENDPOINT
const region = process.env.S3_REGION
const Bucket = process.env.S3_BUCKET

const S3Client = new S3({
    region,
    accessKeyId,
    secretAccessKey,
    endpoint,
    s3ForcePathStyle: true,
    signatureVersion: "v4",
    connectTimeout: 0,
    httpOptions: { timeout: 0 }
})

export {
    S3Client,
    Bucket
}