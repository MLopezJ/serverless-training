
  
import { Stage, StageProps } from "aws-cdk-lib";
import { Construct } from 'constructs'; 
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