import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";

// Constructors for Amazon DynamoDB
const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });

export const handler = async (event: { [x: string]: any; }, context: any) => {

    // Detect requested action from the Amazon API Gateway Event
    const action = event['action']
    const key = event['key'] // image

    if (!action || !key){
        return(console.log('no info provided'))
    }

    if (action === 'getLabels'){
        console.log('getting image labels')

        // requesting labels associate to image
        const result = await getLabels(key);

        return !result ? `No labels related to ${key}` : result
    }
}

const getLabels = async (key: any) => {
    const param = {
        TableName: process.env.TABLE,
        Key: { 'image': { S: key}}
    }

    const data = await ddbClient.send(new GetItemCommand(param));
    return data && data.Item ? data.Item : undefined
}