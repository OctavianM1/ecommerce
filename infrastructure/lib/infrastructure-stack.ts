import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';

export class InfrastructureStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const ecrRepository = new ecr.Repository(this, 'ecs-devops-sandbox-repository');

    const vpc = new ec2.Vpc(this, 'ecs-devops-sandbox-vpc', {
      maxAzs: 2,
      subnetConfiguration: [{ name: 'Public', subnetType: ec2.SubnetType.PUBLIC, cidrMask: 24 }],
    });

    const cluster = new ecs.Cluster(this, 'ecs-devops-sandbox-cluster', {
      vpc,
    });

    cluster.addCapacity('ecs-devops-sandbox-capacity', { instanceType: new ec2.InstanceType('t2.micro') });

    const taskDefinition = new ecs.Ec2TaskDefinition(this, 'ecs-devops-sandbox-task-definition', {
      family: 'ecs-devops-sandbox-task-definition',
    });

    const testRepo = ecr.Repository.fromRepositoryName(this, 'test', 'test');
    const container = taskDefinition.addContainer('ecs-devops-sandbox', {
      image: ecs.ContainerImage.fromEcrRepository(testRepo, 'latest'),
      memoryReservationMiB: 216,
      cpu: 216,
      environment: { PORT: '3100' },
      portMappings: [{ containerPort: 3100, hostPort: 0 }],
    });

    const service = new ecs.Ec2Service(this, 'ecs-devops-sandbox-service', {
      cluster,
      taskDefinition,
      desiredCount: 3,
    });

    const loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'ecs-devops-sandbox-service-load-balancer', {
      vpc,
      internetFacing: true,
    });

    const listener = loadBalancer.addListener('ecs-devops-sandbox-lb-listener', { port: 80 });
    const targetGroup1 = listener.addTargets('ecs-sandbox-target-1', {
      port: 80,
      targets: [
        service.loadBalancerTarget({
          containerName: 'ecs-devops-sandbox',
          containerPort: 3100,
        }),
      ],
    });
  }
}
