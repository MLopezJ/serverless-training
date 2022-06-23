import { DetectLabelsCommand, DetectLabelsCommandInput } from  "@aws-sdk/client-rekognition";
import { ContinuousBackupsUnavailableException, DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import  { RekognitionClient } from "@aws-sdk/client-rekognition";
import { SQSEvent} from 'aws-lambda'
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3"
// @ts-ignore
import * as sharpModule from '/opt/nodejs/node_modules/sharp'; // Uses the location of the module IN the layer
import type * as sharpType from "sharp";
import type { Readable } from "stream";
const sharp = sharpModule.default as typeof sharpType;

const maxLabels: number = 10;
const minConfidence: number = 50;

// Set the AWS Region.
const REGION = "eu-west-1";

// Create SNS service object.
const rekogClient = new RekognitionClient({ region: REGION });

// Constructor for Amazon DynamoDB
const ddbClient = new DynamoDBClient({ region: REGION });

// Constructor for S3
const s3 = new S3Client({})

export const handler = async (event: SQSEvent) => {
    console.log("Lambda processing event: ")
    console.log(JSON.stringify(event))
    const records = event.Records
    for await (const payload of records) {
        const eventInformation = JSON.parse(payload.body)
        for await (const element of eventInformation.Records) {
            await processImage(element);
        }
    }
    return event
}

async function processImage(element: { s3: { bucket: { name: string; }; object: { key: string; }; }; }) {
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

    const photo: string = replaceSubstringWithColon(key);
    const srcKey    = decodeURIComponent(photo.replace(/\+/g, " "));
    const dstBucket = process.env.RESIZEDBUCKET!;

    // Infer the image type from the file suffix.
    const typeMatch = srcKey.match(/\.([^.]*)$/);
    if (!typeMatch) {
        console.log("Could not determine the image type.");
        return;
    }

    // Check that the image type is supported
    const imageType = typeMatch[1].toLowerCase();
    if (imageType != "jpg" && imageType != "png") {
        console.log(`Unsupported image type: ${imageType}`);
        return;
    }

    // Download the image from the S3 source bucket.
    const originalImage = await getImage(bucket, srcKey);
    const stream = originalImage!.Body as Readable
    const buffer = await streamToBuffer(stream);

    // set thumbnail width. Resize will set the height automatically to maintain aspect ratio.
    const width  = 200;

    // Use the sharp module to resize the image and save in a buffer.
    const resizedImage = await resizeImage(buffer, width);

    // Upload the thumbnail image to the destination bucket
    await putImage(dstBucket,srcKey,resizedImage!);

    console.log('Successfully resized ' + bucket + '/' + srcKey +
        ' and uploaded to ' + dstBucket + '/' + srcKey);
}

const streamToBuffer = (stream: Readable) => new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = []
    stream.on('data', chunk => chunks.push(chunk))
    stream.once('end', () => resolve(Buffer.concat(chunks)))
    stream.once('error', reject)
})

const getImage = async (bucket:string, key:string) => {
    try {
        const params = {
            Bucket: bucket,
            Key: key
        };
        
        const originalImageRequest = new GetObjectCommand(params);
        var originalImage = await s3.send(originalImageRequest);
        return originalImage;
    } catch (error) {
        console.log(error);
        return;
    }
}

const resizeImage = async (body:Buffer, width:number) => {
    try {
        var buffer = await sharp(body).resize(width).toBuffer();
        return buffer;
    } catch (error) {
        console.log(error);
        return;
    }
}

const putImage = async (bucket:string, key:string, body:Buffer) => {

    try {
        const destparams = {
            Bucket: bucket,
            Key: key,
            Body: body,
            ContentType: "image"
        };

        const putResizedImageRequest= new PutObjectCommand(destparams)
        const putResizedImage = await s3.send(putResizedImageRequest)
        return putResizedImage
    } catch (error) {
        console.log(error);
        return;
    }
}

// Clean the string to add the ":" symbol back into requested name
const replaceSubstringWithColon = (txt: string) => {
    return txt.replace("%3A", ":")
}