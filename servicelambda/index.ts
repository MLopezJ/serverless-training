const AWS = require("aws-sdk");
import * as os from 'os';

// Constructors for Amazon DynamoDB and S3 resource object
const dynamodb = AWS.resource('dynamodb')
const s3 = AWS.resource('s3')


export const handler = (event: { [x: string]: any; }, context: any) => {

    console.log(' ts lambda')

    // Detect requested action from the Amazon API Gateway Event
    const action = event['action']
    const image = event['image']

    if (!action || !image){
        return(console.log('no info provided'))
    }

    return(console.log(image, action))

}