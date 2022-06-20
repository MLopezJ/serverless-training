import { DetectLabelsCommand, DetectLabelsCommandInput } from  "@aws-sdk/client-rekognition";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import  { RekognitionClient } from "@aws-sdk/client-rekognition";
import { SQSEvent} from 'aws-lambda'

const maxLabels: number = 10
const minConfidence: number = 50

// Set the AWS Region.
const REGION = "eu-west-1";

// Create SNS service object.
const rekogClient = new RekognitionClient({ region: REGION });

// Constructor for Amazon DynamoDB
const ddbClient = new DynamoDBClient({ region: REGION });


export const handler = async (event: SQSEvent) => {
    console.log("Lambda processing event: ", event)
    const records = event.Records
    for await (const payload of records) {
        const eventInformation = JSON.parse(payload.body)
        for await (const element of eventInformation.Records) {
            await processImage(element);
        }
    }
    return event
}

async function processImage(element: { s3: { bucket: { name: any; }; object: { key: any; }; }; }) {
    const bucketName = element.s3.bucket.name;
    const bucketKey = element.s3.object.key;
    await imageLabels(bucketName, bucketKey);
    await generateThumb(bucketName, bucketKey);
}

const imageLabels = async (bucket: string, key: string) => {
    console.log('Work in progress from imageLabels ', bucket, key)

    const photo: string = replaceSubstringWithColon(key);

    console.log('Currently processing the following image')
    console.log('Bucket: ' + bucket + ' photo name: ' + photo)

    const params = {
        Image: {
          S3Object: {
            Bucket: bucket,
            Name: photo
          },
        },
        MaxLabels: maxLabels,
        MinConfidence: minConfidence
    }

    const labelsRequest: any = await rekFunction(params);
    const labels = labelsRequest?.Labels?.reduce(
        (previousValue: {[k: string]: {[k: string]: string}}, currentValue: {Name: string}, currentIndex: number) => { 
            previousValue[`object${currentIndex}`] = { S : currentValue.Name }
            return previousValue
         }, {})

    await saveLabelsInDb(labels, photo)
    return labels
}

const rekFunction = async (params: DetectLabelsCommandInput) => {
    try {
        const response = await rekogClient.send(new DetectLabelsCommand(params));
        return response; 
      } catch (err) {
        console.log("Error", err);
        return err
      }
};

const saveLabelsInDb = async (labels: any, key: string) => {
    const item = labels
    item['image'] = { S : key }
    console.log('work in progress to save recognized labels on dynamo db')
    const param = {
        TableName: process.env.TABLE,
        Item: item
    }
    try{
        const putCommand = new PutItemCommand(param)
        const saveLabels = await ddbClient.send(putCommand)
        return saveLabels
    } catch (err) {
        console.log("Error", err);
        return err
    }
}

const generateThumb = async (bucket: string, key: string) => {
    console.log('Work in progress from generateThumb ', bucket, key)
}

// Clean the string to add the ":" symbol back into requested name
const replaceSubstringWithColon = (txt: string) => {
    return txt.replace("%3A", ":")
}