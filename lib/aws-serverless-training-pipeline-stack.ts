import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import { Construct } from 'constructs'; 
import { SecretValue, Stack, StackProps } from 'aws-cdk-lib';
import { CdkPipeline,  SimpleSynthAction } from 'aws-cdk-lib/pipelines';
import { AwsServerlessTrainingPipelineStage } from "./aws-serverless-training-pipeline-stage";
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { ManualApprovalAction } from 'aws-cdk-lib/aws-codepipeline-actions';

/**
 * Stack to define the awsserverless-training application pipeline
 *
 * Prerequisite:
 *  Github personal access token should be stored in Secret Manager with id as below
 *  Github owner value should be set up in System manager - Parameter store with name as below
 *  Github repository value should be set up in System manager - Parameter store with name as below
 *  Github branch value should be set up in System manager - Parameter store with name as below
 * */

export class AwsServerlessTrainingPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
  
    const sourceArtifact = new codepipeline.Artifact();
    const cloudAssemblyArtifact = new codepipeline.Artifact();
  
    const githubOwner = StringParameter.fromStringParameterAttributes(this, 'gitOwner',{
      parameterName: 'serverless-training-git-owner'
    }).stringValue;
  
    const githubRepo = StringParameter.fromStringParameterAttributes(this, 'gitRepo',{
      parameterName: 'serverless-training-git-repo'
    }).stringValue;
  
    const githubBranch = StringParameter.fromStringParameterAttributes(this, 'gitBranch',{
      parameterName: 'serverless-training-git-branch'
    }).stringValue;
    
    const pipeline = new CdkPipeline(this, 'Pipeline', {
      crossAccountKeys: false,
      cloudAssemblyArtifact,
      // Define application source
      sourceAction: new codepipeline_actions.GitHubSourceAction({
        actionName: 'GitHub',
        output: sourceArtifact,
        oauthToken: SecretValue.secretsManager('serverless-training-git-access-token', {jsonField: 'serverless-training-git-access-token'}), // this token is stored in Secret Manager
        owner: githubOwner,
        repo: githubRepo,
        branch: githubBranch
      }),
      // Define build and synth commands
      synthAction: SimpleSynthAction.standardNpmSynth({
        sourceArtifact,
        cloudAssemblyArtifact,
        //This build command is to download pillow library, unzip the downloaded file and tidy up.
        //If you already have pillow library downloaded under reklayer/, please just run 'npm run build'
        // buildCommand: 'rm ./reklayer/pillow-goes-here.txt && wget https://awsdevhour.s3-accelerate.amazonaws.com/pillow.zip && unzip pillow.zip && mv ./python ./reklayer && rm pillow.zip && npm run build',
        buildCommand: 'npm run build',
        synthCommand: 'npm run cdk synth'
      })
    });
     
    //Define application stage
    const devStage = pipeline.addApplicationStage(new AwsServerlessTrainingPipelineStage(this, 'dev'));

    // devStage.addActions(new ManualApprovalAction({
    //   actionName: 'ManualApproval',
    //   runOrder: devStage.nextSequentialRunOrder(),
    // }));

  }
}