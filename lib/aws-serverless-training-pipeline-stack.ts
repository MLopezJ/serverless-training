import { Construct } from 'constructs'; 
import { SecretValue, Stack, StackProps } from 'aws-cdk-lib';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import { AwsServerlessTrainingPipelineStage } from "./aws-serverless-training-pipeline-stage";
import { StringParameter } from 'aws-cdk-lib/aws-ssm';

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

    // comment those just for testing proposals
    
    const githubOwner = StringParameter.valueFromLookup(this, 'serverless-training-git-owner');

    const githubRepo = StringParameter.valueFromLookup(this, 'serverless-training-git-repo');
  
    const githubBranch = StringParameter.valueFromLookup(this,  'serverless-training-git-branch');

    const source = CodePipelineSource.gitHub(`${githubOwner}/${githubRepo}`, githubBranch, {
      authentication: SecretValue.secretsManager('serverless-training-git-access-token', {jsonField: 'serverless-training-git-access-token'})
    })

    const pipeline =  new CodePipeline(this, 'Pipeline', {
      // selfMutation: false,
      // crossAccountKeys: false,
      pipelineName: 'MyPipeline',
      synth: new ShellStep('SynthStep', {
        input: source,
        installCommands: [
          'npm install -g aws-cdk'
      ],
      commands: [
          'npm ci',
          'npm run build',
          'npx cdk synth'
      ]
      })
    });

    const devStage = pipeline.addStage(new AwsServerlessTrainingPipelineStage(this, 'dev'));

    // devStage.addActions(new ManualApprovalAction({
    //   actionName: 'ManualApproval',
    //   runOrder: devStage.nextSequentialRunOrder(),
    // }));

  }
}