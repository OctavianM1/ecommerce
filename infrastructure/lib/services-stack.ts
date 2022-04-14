import { NestedStack, NestedStackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { createEcsCluster, EcsClusterOutput } from '../utils/createEcsCluster';

interface ServicesStackProps extends NestedStackProps {
  readonly vpc: ec2.Vpc;
}

export const services = [
  {
    name: 'basket-service',
    containerPort: 3100,
  },
  {
    name: 'ordering-service',
    containerPort: 3101,
  },
  {
    name: 'products-service',
    containerPort: 3102,
  },
  {
    name: 'users-service',
    containerPort: 3103,
  },
];

export class ServicesStack extends NestedStack {
  public outputs: EcsClusterOutput[];
  constructor(scope: Construct, props: ServicesStackProps) {
    super(scope, 'services-stack', props);
    const { vpc } = props;
    this.outputs = [];

    for (const service of services) {
      const output = createEcsCluster({
        scope,
        vpc,
        service,
      });
      this.outputs.push(output);
    }
  }
}
