import {
  NestedStack,
  NestedStackProps,
  SecretValue,
  Stack,
  StackProps,
  Stage,
  StageProps,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as pipelines from 'aws-cdk-lib/pipelines';
import * as amplify from '@aws-cdk/aws-amplify-alpha';
import * as iam from 'aws-cdk-lib/aws-iam';
import { services, ServicesStack } from './services-stack';
import { ApiGatewayBffStack } from './api-gateway-stack';
import { EShopUIStack } from './frontend-stacks';

// export class PipelineStack extends Stack {
//   constructor(scope: Construct, id: string, props?: StackProps) {
//     super(scope, id, props);

//     const pipeline = new pipelines.CodePipeline(this, 'test-pipeline', {
//       synth: new pipelines.ShellStep('Synth', {
//         input: pipelines.CodePipelineSource.connection('OctavianM1/ecommerce', 'release', {
//           connectionArn:
//             'arn:aws:codestar-connections:eu-central-1:656983766737:connection/64fef60c-b47b-4928-8044-1f861c8dbdde',
//         }),
//         commands: ['cd infrastructure', 'npm ci', 'npm run build', 'npx cdk synth'],
//         primaryOutputDirectory: 'infrastructure/cdk.out',
//       }),
//     });
//     pipeline.addStage(new MyApplication(this, 'test-env'), {
//       pre: [new pipelines.ManualApprovalStep('DeployToEnv')],
//     });
//   }
// }

// class MyApplication extends Stage {
//   constructor(scope: Construct, id: string, props?: StageProps) {
//     super(scope, id, props);

//     new BasketService(this, 'basket-service-stack');
//   }
// }

export class AppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'services-vpc', {
      maxAzs: 2,
      subnetConfiguration: [{ name: 'Public', subnetType: ec2.SubnetType.PUBLIC, cidrMask: 24 }], // public subnets due of NAT Gateway pricing
    });

    const servicesStack = new ServicesStack(this, { vpc });
    const servicesEnvironment = servicesStack.outputs.map((o) => ({
      key: `${o.serviceName.replace('-', '_').toUpperCase()}_URL`, // e.g. from basket-service to BASKET_SERVICE_URL
      dns: o.loadBalancer.loadBalancerDnsName,
    }));

    servicesStack.outputs.forEach((o) => {
      servicesEnvironment.forEach((sEnv) => {
        o.container.addEnvironment(sEnv.key, sEnv.dns);
      });
    });

    const apiGatewaysStack = new ApiGatewayBffStack(this, {
      vpc,
      bffProps: {
        'customer-bff': servicesEnvironment,
      },
    });
    const apiGatewaysEnvironment = apiGatewaysStack.outputs.reduce((env: { [key: string]: string }, o) => {
      env[`${o.serviceName.replace('-', '_').toUpperCase()}_URL`] = o.loadBalancer.loadBalancerDnsName;
      return env;
    }, {});

    new EShopUIStack(this, { env: apiGatewaysEnvironment });
  }
}
