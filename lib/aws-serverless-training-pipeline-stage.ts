
  
import { CfnOutput, Construct, Stage, StageProps } from "@aws-cdk/core";
import { AwsServerlessTrainingStack } from "./aws-serverless-training-stack";

/**
 * Deployable unit of awsdevhour-backend app
 * */
export class AwsServerlessTrainingPipelineStage extends Stage {
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);
    
    new AwsServerlessTrainingStack(this, 'AwsServerlessTrainingStack-dev');
    
  }
}