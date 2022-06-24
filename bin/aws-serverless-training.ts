#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { stackNamePrefix } from "cdk/stackName";
import "source-map-support/register";
import { AwsServerlessTrainingPipelineStack } from "../cdk/aws-serverless-training-pipeline-stack";
import { AwsServerlessTrainingStack } from "../cdk/aws-serverless-training-stack";

const app = new cdk.App({
  context: {
    "backend.repository":
      process.env.BACKEND_REPOSITORY ?? "MLopezJ/serverless-training",
    "backend.branch": process.env.BACKEND_BRANCH ?? "saga",
  },
});
new AwsServerlessTrainingStack(app, `${stackNamePrefix}Stack`, {});

new AwsServerlessTrainingPipelineStack(
  app,
  `${stackNamePrefix}PipelineStack`,
  {}
);
