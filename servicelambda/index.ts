import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });

// Constructors for Amazon DynamoDB and S3 resource object
/*
const dynamodb = AWS.resource('dynamodb')
const s3 = AWS.resource('s3')
*/


export const handler = async (event: { [x: string]: any; }, context: any) => {

    console.log(' ts lambda')

    // Detect requested action from the Amazon API Gateway Event
    const action = event['action']
    const key = event['image'] // image

    if (!action || !key){
        return(console.log('no info provided'))
    }

    if (action === 'getLabels'){
        console.log('getting image labels')
        const result = await getLabels(event); // requesting labels associate to image
        console.log(result)
    }

    return {
        body: JSON.stringify({message: 'Successful .ts lambda invocation'}),
        statusCode: 200,
      };
}

const getLabels = async (info: any) => {
    const {key} = info
    console.log('!!', process.env)

    const param = {
        TableName: 'dev-AwsServerlessTrainingStack-dev-ImageLabelsE524135D-1M25SW87XMWZF', // process.env.TABLE,
        Key: { 'image': { S: key}} // KEY_NAME
    }

    const data = await ddbClient.send(new GetItemCommand(param));
    console.log("Success: ", data.Item);
    return data;
}

const run = async () => {
    
    
  };

const instanceDB = () => {
    
    const envName  = process.env.TABLE;
    //const table  = dynamo.Table(envName)
    
}