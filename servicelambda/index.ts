import { DynamoDBClient, GetItemCommand, DeleteItemCommand } from "@aws-sdk/client-dynamodb";
// import { S3Client, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

import { S3Client } from "@aws-sdk/client-s3"

// Constructor for Amazon DynamoDB
const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });

// Constructor for S3
/*
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
    }
})
*/

export const handler = async (event: { [x: string]: any; }, context: any) => {

    // Detect requested action from the Amazon API Gateway Event
    const action = event['action']
    const key = event['key'] // image

    if (!action || !key){
        return(console.log('no info provided'))
    }

    if (action === 'getLabels'){
        console.log('1- getting image labels: ', key)

        // requesting labels associate to image
        const result = await getLabels(key);
        console.log('4- result to return: ', result)

        if (!result)
            console.log(`No labels related to ${key}`)

        return result
    }

    if (action === 'deleteImage'){
        console.log('deleting image from buckets')

        // requesting labels associate to image
        const result = await deleteImage(key);

        return !result ? `Not possible to delete ${key}` : result
    }
}

const getLabels = async (key: any) => {
    const param = {
        TableName: process.env.TABLE,
        Key: { 'image': { S: key}}
    }
    console.log('2- Requesting labels ', param)

    const data = await ddbClient.send(new GetItemCommand(param));
    console.log('3- info returned: ', data)
    return data.Item
}


const deleteImage = async (key: string) => {
    const value = `private/eu-west-1:78ad3dad-3394-47fe-867a-2a0ddf50ba3d/photos/${key}` // temporal mock of value
    const bucketName = process.env.BUCKET
    const resizedBucketName = process.env.RESIZEDBUCKET

    const labelsParam = {
        TableName: process.env.TABLE,
        Key: { 'image': { S: value}}
    }

    const bucketParam = {
        Bucket : bucketName,
        Key: value
    }

    const resizedBucketParam = {
        Bucket : resizedBucketName,
        Key: value
    }

    return 'testing'
    

    /*
    // delete labels
    const deleteLabels = await ddbClient.send(new DeleteItemCommand(labelsParam));
    console.log(deleteLabels)

    // delete image
    const bucketRequest = new DeleteObjectCommand(bucketParam)
    const bucketResponse = await s3.send(bucketRequest)
    console.log(bucketResponse)

    const resizedBucketRequest= new DeleteObjectCommand(resizedBucketParam)
    const resizedBucketResponse = await s3.send(resizedBucketRequest)
    console.log(resizedBucketResponse)

    return ({bucketResponse, resizedBucketResponse})
    
    const data = await ddbClient.send(new GetObjectCommand(bucketParam));
    console.log(data)
    return data
    */
    
}
