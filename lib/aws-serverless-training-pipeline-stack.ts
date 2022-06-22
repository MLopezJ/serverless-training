import { Construct } from 'constructs'; 
import { SecretValue, Stack, StackProps } from 'aws-cdk-lib';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import { AwsServerlessTrainingPipelineStage } from "./aws-serverless-training-pipeline-stage";

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

    const source = CodePipelineSource.gitHub('MLopezJ/serverless-training', 'dev', {
      authentication: SecretValue.secretsManager('serverless-training-git-access-token', {jsonField: 'serverless-training-git-access-token'})
    })

    const pipeline =  new CodePipeline(this, 'Pipeline', {
      pipelineName: 'MyPipeline',
      synth: new ShellStep('SynthStep', {
        input: source,
        installCommands: [
          'npm install -g aws-cdk',
      ],
      commands: [
          'npm ci',
          'npm run build',
          'cd layers/sharp/nodejs && npm ci',
          'npx cdk synth',
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