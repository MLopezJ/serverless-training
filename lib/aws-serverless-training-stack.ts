import * as cdk from '@aws-cdk/core';
import s3 = require('@aws-cdk/aws-s3');

const imageBucketName = "cdk-serverlesstraining-imgbucket"


export class AwsServerlessTrainingStack extends cdk.Stack  {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // =====================================================================================
    // Image Bucket
    // =====================================================================================
    const imageBucket = new s3.Bucket(this, imageBucketName, {
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });
  }
}
