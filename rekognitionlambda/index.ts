import { DetectLabelsCommand, DetectLabelsCommandInput } from  "@aws-sdk/client-rekognition";
import  { RekognitionClient } from "@aws-sdk/client-rekognition";

const maxLabels: number = 10
const minConfidence: number = 50

// Set the AWS Region.
const REGION = "eu-west-1"; //e.g. "us-east-1"
// Create SNS service object.
const rekogClient = new RekognitionClient({ region: REGION });

export const handler = async (event: { [x: string]: any; }, context: any) => {

    console.log("Lambda processing event: ", event)

    const records = event.Records ?? []

    await records.map((payload: { body: string; }) => {
        const eventInformation = JSON.parse(payload.body)
        eventInformation.Records.map(async (element: { s3: { bucket: { name: any; }; object: { key: any; }; }; }) => {
            const bucketName = element.s3.bucket.name
            const bucketKey = element.s3.object.key
            await rekFunction(bucketName, bucketKey)
            generateThumb(bucketName, bucketKey)
        })
    })

    return event
}

const rekFunction = async (bucket: string, key: string) => {
    console.log('Work in progress from rekFunction ', bucket, key)

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

    const response = await detect_labels(params);

    let labels: (string | undefined)[] = []

    if (response?.Labels){
        response.Labels.map(label => {
            labels.push(label.Name)
        })
    }
    console.log('LABELS ', labels)

    return labels
}

const detect_labels = async (params: DetectLabelsCommandInput) => {
    try {
        const response = await rekogClient.send(new DetectLabelsCommand(params));
        console.log(response.Labels)
        if (response.Labels){
            response.Labels.forEach(label =>{
                console.log(`Confidence: ${label.Confidence}`)
                console.log(`Name: ${label.Name}`)
                if (label.Instances){
                    console.log('Instances:')
                    label.Instances.forEach(instance => {
                        console.log(instance)
                    })
                }
                if (label.Parents){
                    console.log('Parents:')
                label.Parents.forEach(name => {
                    console.log(name)
                })
                }
                console.log("-------")
            })
        }
        
        return response; // For unit tests.
      } catch (err) {
        console.log("Error", err);
      }
};

const generateThumb = (bucket: string, key: string) => {
    console.log('Work in progress from generateThumb ', bucket, key)
}

// Clean the string to add the ":" symbol back into requested name
const replaceSubstringWithColon = (txt: string) => {
    return txt.replace("%3A", ":")
}