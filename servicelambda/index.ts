import { DynamoDBClient, GetItemCommand, DeleteItemCommand } from "@aws-sdk/client-dynamodb";
// import { S3Client, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

import { S3Client, GetObjectCommand, ListObjectsCommand } from "@aws-sdk/client-s3"

// Constructor for Amazon DynamoDB
const ddbClient = new DynamoDBClient({});

// Constructor for S3
const s3 = new S3Client({})

export const handler = async (event: { [x: string]: any; }, context: any) => {

    // Detect requested action from the Amazon API Gateway Event
    const action = event['action']
    const key = event['key'] // image

    if (!action || !key){
        return(console.log('no info provided'))
    }

    if (action === 'getLabels'){

        // requesting labels associate to image
        const result = await getLabels(key);

        if (!result)
            console.log(`No labels related to ${key}`)

        return result
    }

    if (action === 'deleteImage'){
        console.log('deleting image from buckets')

        // requesting labels associate to image
        const result = await deleteImage(key);

        if (!result)
            console.log(`Impossible to delete image: ${key}`)

        return result
    }
}

const getLabels = async (key: any) => {
    const param = {
        TableName: process.env.TABLE,
        Key: { 'image': { S: key}}
    }

    const data = await ddbClient.send(new GetItemCommand(param));
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


    const get = new GetObjectCommand(bucketParam)
    const getList = new ListObjectsCommand({Bucket:bucketName})
    const getResponse = await s3.send(get)
    const getListResponse = await s3.send(getList)
    console.log(getResponse)
    console.log(getListResponse)
    return getResponse

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
    */
    
}
