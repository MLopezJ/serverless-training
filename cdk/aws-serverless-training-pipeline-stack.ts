import { SecretValue, Stack, StackProps } from "aws-cdk-lib";
import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
} from "aws-cdk-lib/pipelines";
import { Construct } from "constructs";
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

    const source = CodePipelineSource.gitHub(
      this.node.tryGetContext("backend.repository"),
      this.node.tryGetContext("backend.branch"),
      {
        authentication: SecretValue.secretsManager(
          `${this.stackName}/github-access-token`
        ),
      }
    );

    const pipeline = new CodePipeline(this, "Pipeline", {
      pipelineName: "MyPipeline",
      synth: new ShellStep("SynthStep", {
        input: source,
        installCommands: ["npm install -g aws-cdk"],
        commands: [
          "npm ci",
          "npm run build",
          "cd layers/sharp/nodejs && npm ci && cd ../../..",
          "npx cdk synth",
        ],
      }),
    });

    pipeline.addStage(new AwsServerlessTrainingPipelineStage(this, "dev"));
  }
}
