const AWS = require("aws-sdk");
import * as os from 'os';

// Constructors for Amazon DynamoDB and S3 resource object
/*
const dynamodb = AWS.resource('dynamodb')
const s3 = AWS.resource('s3')
*/


export const handler = (event: { [x: string]: any; }, context: any) => {

    console.log(' ts lambda')

    // Detect requested action from the Amazon API Gateway Event
    const action = event['action']
    const key = event['image']

    if (!action || !key){
        return(console.log('no info provided'))
    }

    console.log(key, action)
    return {
        body: JSON.stringify({message: 'Successful .ts lambda invocation'}),
        statusCode: 200,
      };

}