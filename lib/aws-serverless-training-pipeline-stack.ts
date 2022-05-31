// import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
// import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import { Construct } from 'constructs'; 
import { SecretValue, Stack, StackProps } from 'aws-cdk-lib';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import { AwsServerlessTrainingPipelineStage } from "./aws-serverless-training-pipeline-stage";
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
// import { ManualApprovalAction } from 'aws-cdk-lib/aws-codepipeline-actions';
// import { Code } from 'aws-cdk-lib/aws-lambda';

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

    // sourceArtifact
  
    /*
    const sourceArtifact = new codepipeline.Artifact();
    const cloudAssemblyArtifact = new codepipeline.Artifact();
    */
  
    /*
    const githubOwner = StringParameter.valueFromLookup(this, 'serverless-training-git-owner');

    const githubRepo = StringParameter.valueFromLookup(this, 'serverless-training-git-repo');
  
    const githubBranch = StringParameter.valueFromLookup(this,  'serverless-training-git-branch');

    const source = CodePipelineSource.gitHub(`${githubOwner}/${githubRepo}`, githubBranch, {
      authentication: SecretValue.secretsManager('serverless-training-git-access-token', {jsonField: 'serverless-training-git-access-token'})
    })
    /*

    /* CodePipelineSource.gitHub('MLopezJ/serverless-training', 'dev', {
      authentication: SecretValue.secretsManager('serverless-training-git-access-token', {jsonField: 'serverless-training-git-access-token'})
    })
    */


    const pipeline =  new CodePipeline(this, 'Pipeline', {
      selfMutation: false,
      crossAccountKeys: false,
      pipelineName: 'MyPipeline',
      
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.gitHub('MLopezJ/serverless-training', 'dev', {
          authentication: SecretValue.secretsManager('serverless-training-git-access-token', {jsonField: 'serverless-training-git-access-token'})
        }),
        // commands: ['npm run build', 'npm run cdk synth']  // npx cdk synth // 'npm ci', 
        commands: [
          'pwd'
          // 'npm install',
          // 'npm ci',
          // 'npx cdk deploy "*"',
                  ]
      })
    });

    pipeline.buildPipeline()

    //pipeline.addStage()
    
  
    /*
    const ppln = new CdkPipeline(this, 'Pipeline', {
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
    */
     
    //Define application stage
    // pipeline.addStage(new AwsServerlessTrainingPipelineStage(this, 'dev'));
    const devStage = pipeline.addStage(new AwsServerlessTrainingPipelineStage(this, 'dev'));

    // devStage.addActions(new ManualApprovalAction({
    //   actionName: 'ManualApproval',
    //   runOrder: devStage.nextSequentialRunOrder(),
    // }));

  }
}