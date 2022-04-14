import { NestedStack, NestedStackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import { createEcsCluster } from '../utils/createEcsCluster';

type ConnectedService = {
  dns: string;
  key: string;
};

interface ApiGatewayBffStackProps extends NestedStackProps {
  readonly vpc: ec2.Vpc;
  bffProps: {
    [key in BffName]: ConnectedService[];
  };
}

type BffName = 'customer-bff'; // | 'administrator-bff'

type BffStructure = {
  name: BffName;
  containerPort: 3200;
};

const bffs: BffStructure[] = [
  {
    name: 'customer-bff',
    containerPort: 3200,
  },
];

export class ApiGatewayBffStack extends NestedStack {
  public outputs;
  constructor(scope: Construct, props: ApiGatewayBffStackProps) {
    super(scope, 'api-gateway-stack', props);
    const { vpc, bffProps } = props;
    this.outputs = [];
    for (const service of bffs) {
      const connectedServices = bffProps[service.name];

      const env: { [key: string]: string } = {};
      for (let connectedService of connectedServices) {
        env[connectedService.key] = connectedService.dns;
      }

      const output = createEcsCluster({
        scope,
        vpc,
        service,
        env,
      });
      this.outputs.push(output);
    }
  }
}
