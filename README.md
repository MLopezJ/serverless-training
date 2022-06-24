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

The token should have the scopes `repo` and `admin:repo_hook`.

    aws ssm put-parameter --type String --name /${STACK_NAME_PREFIX:-ServerlessTraining}Stack-github-access-token --value <your personall access key>
