import { Stage, StageProps } from "aws-cdk-lib";
import { stackNamePrefix } from "cdk/stackName";
import { Construct } from "constructs";
import { ImageGalleryStack } from "../stacks/image-gallery";

/**
 * Deployable unit of awsdevhour-backend app
 * */
export class ContinuousDeploymentPipelineStage extends Stage {
  constructor(scope: Construct, id: string, stage: "dev", props?: StageProps) {
    super(scope, id, props);

    new ImageGalleryStack(this, `${stackNamePrefix}-${stage}`);
  }
}
