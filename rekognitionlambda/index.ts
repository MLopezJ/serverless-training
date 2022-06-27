import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import {
  DetectLabelsCommand,
  Label,
  RekognitionClient,
} from "@aws-sdk/client-rekognition";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { fromEnv } from "@nordicsemiconductor/from-env";
import { S3EventRecord, SQSEvent } from "aws-lambda";
import type * as sharpType from "sharp";
import type { Readable } from "stream";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as sharpModule from "/opt/nodejs/node_modules/sharp"; // Uses the location of the module IN the layer
const sharp = sharpModule.default as typeof sharpType;

const { dstBucket, TableName } = fromEnv({
  dstBucket: "RESIZEDBUCKET",
  TableName: "TABLE",
})(process.env);

const maxLabels = parseInt(process.env.MAX_LABELS ?? "10", 10);
const minConfidence = parseInt(process.env.MIN_CONFIDENCE ?? "50", 10);

const rekogClient = new RekognitionClient({});
const ddbClient = new DynamoDBClient({});
const s3 = new S3Client({});

export const handler = async (event: SQSEvent): Promise<void> => {
  console.log("Lambda processing event: ");
  console.log(JSON.stringify(event));
  const records = event.Records;
  for await (const payload of records) {
    const eventInformation = JSON.parse(payload.body);
    for await (const element of eventInformation.Records) {
      await processImage(element);
    }
  }
};

async function processImage(element: S3EventRecord) {
  const bucketName = element.s3.bucket.name;
  const bucketKey = element.s3.object.key;
  await imageLabels(bucketName, bucketKey);
  await generateThumb(bucketName, bucketKey);
}

const imageLabels = async (bucket: string, imageKey: string) => {
  const photo = replaceSubstringWithColon(imageKey);

  console.log("Currently processing the following image");
  console.log("Bucket: " + bucket + " photo name: " + photo);

  const labelsRequest = await rekogClient.send(
    new DetectLabelsCommand({
      Image: {
        S3Object: {
          Bucket: bucket,
          Name: photo,
        },
      },
      MaxLabels: maxLabels,
      MinConfidence: minConfidence,
    })
  );

  const labels: Record<
    string,
    Record<string, string>
  > = labelsRequest?.Labels?.reduce(
    (
      previousValue: { [k: string]: { [k: string]: string } },
      currentValue: Label,
      currentIndex: number
    ) => {
      previousValue[`object${currentIndex}`] = {
        S: currentValue.Name ?? "unknown",
      };
      return previousValue;
    },
    {}
  ) ?? {};

  await ddbClient.send(
    new PutItemCommand({
      TableName,
      Item: {
        ...labels,
        image: { S: imageKey },
      },
    })
  );
  return labels;
};

const generateThumb = async (bucket: string, key: string): Promise<void> => {
  console.log("Work in progress from generateThumb ", bucket, key);

  const photo = replaceSubstringWithColon(key);
  const srcKey = decodeURIComponent(photo.replace(/\+/g, " "));

  // Infer the image type from the file suffix.
  const typeMatch = /\.([^.]*)$/.exec(srcKey);
  if (typeMatch === null) {
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
  const originalImage = await s3.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: srcKey,
    })
  );
  if (originalImage === undefined) {
    console.error(`Original image ${bucket}/${srcKey} not found.`);
    return;
  }
  const stream = originalImage.Body as Readable;
  const buffer = await streamToBuffer(stream);

  // set thumbnail width. Resize will set the height automatically to maintain aspect ratio.
  const width = 200;

  // Use the sharp module to resize the image and save in a buffer.
  const resizedImage = await sharp(buffer).resize(width).toBuffer();
  if (resizedImage === undefined) {
    console.error(`Failed to resize image ${bucket}/${srcKey}!`);
    return;
  }

  // Upload the thumbnail image to the destination bucket
  await s3.send(
    new PutObjectCommand({
      Bucket: dstBucket,
      Key: srcKey,
      Body: resizedImage,
      ContentType: "image",
    })
  );

  console.log(
    "Successfully resized " +
      bucket +
      "/" +
      srcKey +
      " and uploaded to " +
      dstBucket +
      "/" +
      srcKey
  );
};

const streamToBuffer = async (stream: Readable): Promise<Buffer> =>
  new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.once("end", () => resolve(Buffer.concat(chunks)));
    stream.once("error", reject);
  });

// Clean the string to add the ":" symbol back into requested name
const replaceSubstringWithColon = (txt: string) => txt.replace("%3A", ":");
