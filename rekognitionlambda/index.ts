export const handler = async (event: { [x: string]: any; }, context: any) => {

    console.log("Lambda processing event: ", event)

    const records = event.Records ?? []
    console.log(records, typeof records)

    records.map((payload: { body: string; }) => {
        console.log(typeof payload.body, payload.body)
        const eventInformation = JSON.parse(payload.body) 
        console.log(eventInformation.Records, typeof eventInformation.Records)
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