#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
// import { PipelineStack } from '../lib/infrastructure-stack';
import { AppStack } from '../lib/infrastructure-stack';

const app = new cdk.App();

const stackProps = {
  env: {
    region: 'eu-central-1',
  },
};

// new PipelineStack(app, 'PipelineStack', stackProps);

new AppStack(app, 'AppStack', stackProps);
