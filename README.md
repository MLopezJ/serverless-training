# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template

## Set GitHub personal access token for the pipeline

> **Note**
> This is using the [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/), not the [AWS Systems Manager Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html)

The token should have the scopes `repo` and `admin:repo_hook`.

    aws secretsmanager create-secret --name ${STACK_NAME_PREFIX:-ServerlessTraining}PipelineStack-github-access-token --secret-string <your personal access key>
