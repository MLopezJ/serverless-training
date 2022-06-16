export const handler = async (event: { [x: string]: any; }, context: any) => {

    console.log("Lambda processing event: ", event)

    const records = event.Records ?? []

    records.map((payload: { body: string; }) => {
        const eventInformation = JSON.parse(payload.body)
        eventInformation.Records.map((element: { s3: { bucket: { name: any; }; object: { key: any; }; }; }) => {
            const bucketName = element.s3.bucket.name
            const bucketKey = element.s3.object.key
            rekFunction(bucketName, bucketKey)
            generateThumb(bucketName, bucketKey)
        })
    })

    return event
}

const rekFunction = (bucket: string, key: string) => {
    console.log('Work in progress from rekFunction ', bucket, key)
}

const generateThumb = (bucket: string, key: string) => {
    console.log('Work in progress from generateThumb ', bucket, key)
}