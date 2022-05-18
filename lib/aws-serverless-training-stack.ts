import * as cdk from '@aws-cdk/core';
import { Duration } from '@aws-cdk/core';
import s3 = require('@aws-cdk/aws-s3');
import dynamodb = require('@aws-cdk/aws-dynamodb');
import lambda = require('@aws-cdk/aws-lambda');
import iam = require('@aws-cdk/aws-iam');
import event_sources = require('@aws-cdk/aws-lambda-event-sources');

// This is the CDK internal resource ID, not the S3 bucket name!
const imageBucketResourceId = "cdk-serverlesstraining-imgbucket"
const resizedBucketId = imageBucketResourceId + "-resized"


export class AwsServerlessTrainingStack extends cdk.Stack  {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // =====================================================================================
    // Image Bucket
    // =====================================================================================
    const imageBucket = new s3.Bucket(this, imageBucketResourceId, {
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });
    new cdk.CfnOutput(this, 'imageBucket', { value: imageBucket.bucketName });

    // =====================================================================================
    // Thumnail Bucket
    // =====================================================================================
    const resizedBucket = new s3.Bucket(this, resizedBucketId, {
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });
    new cdk.CfnOutput(this, 'resizedBucket', { value: resizedBucket.bucketName });

    // =====================================================================================
    // Amazon DynamoDB table for storing image labels
    // =====================================================================================
    const table = new dynamodb.Table(this, 'ImageLabels', {
      partitionKey: { name: 'image', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });
    new cdk.CfnOutput(this, 'ddbTable', { value: table.tableName });

    // =====================================================================================
    // Building our AWS Lambda Function; compute for our serverless microservice
    // =====================================================================================
    const rekFn = new lambda.Function(this, 'rekognitionFunction', {
      code: lambda.Code.fromAsset('rekognitionlambda'),
      runtime: lambda.Runtime.PYTHON_3_7,
      handler: 'index.handler',
      timeout: Duration.seconds(30),
      memorySize: 1024,
      environment: {
          "TABLE": table.tableName,
          "BUCKET": imageBucket.bucketName
      },
    });

    rekFn.addEventSource(new event_sources.S3EventSource(imageBucket, { events: [ s3.EventType.OBJECT_CREATED ]}));
    imageBucket.grantRead(rekFn);
    table.grantWriteData(rekFn);

    rekFn.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['rekognition:DetectLabels'],
      resources: ['*']
    }));

  }
}
