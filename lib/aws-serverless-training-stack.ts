import * as cdk from 'aws-cdk-lib'
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import s3 = require('aws-cdk-lib/aws-s3');

const imageBucketName = "cdk-serverlesstraining-imgbucket"


export class AwsServerlessTrainingStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // =====================================================================================
    // Image Bucket
    // =====================================================================================
    const bucket = new s3.Bucket(this, 'MyFirstBucket');

    const imageBucket = new s3.Bucket(this, imageBucketName, {
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });
  }
}
