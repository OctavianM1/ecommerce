import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';

type ClusterInstanceProps = {
  name: string;
  containerPort: number;
};

type CreateEcsClusterProps = {
  readonly vpc: ec2.Vpc;
  readonly scope: Construct;
  readonly service: ClusterInstanceProps;
  readonly env?: { [key: string]: string };
};

export type EcsClusterOutput = {
  loadBalancer: elbv2.ApplicationLoadBalancer;
  container: ecs.ContainerDefinition;
  serviceName: string;
};

export function createEcsCluster({ vpc, scope, service, env = {} }: CreateEcsClusterProps) {
  const cluster = new ecs.Cluster(scope, `${service.name}-ecs-cluster`, {
    vpc,
  });

  cluster.addCapacity(`${service.name}-ecs-capacity`, {
    instanceType: new ec2.InstanceType('t2.micro'),
    minCapacity: 1,
    desiredCapacity: 1,
    maxCapacity: 3,
  });

  const taskDefinition = new ecs.Ec2TaskDefinition(scope, `${service.name}-task-definition`, {
    family: `${service.name}-task-definition`,
  });

  const ecrRepo = ecr.Repository.fromRepositoryName(scope, `${service.name}-repo-name`, `${service.name}`);
  const container = taskDefinition.addContainer(`${service.name}-ecs-container`, {
    image: ecs.ContainerImage.fromEcrRepository(ecrRepo, 'latest'),
    memoryReservationMiB: 216,
    cpu: 216,
    environment: { ...env, PORT: service.containerPort.toString() },
    portMappings: [{ containerPort: service.containerPort, hostPort: 0 }],
  });

  const ecsService = new ecs.Ec2Service(scope, `${service.name}-ecs-service`, {
    cluster,
    taskDefinition,
    desiredCount: 2,
    deploymentController: {
      type: ecs.DeploymentControllerType.CODE_DEPLOY,
    },
  });

  const loadBalancer = new elbv2.ApplicationLoadBalancer(scope, `${service.name}-load-balancer`, {
    vpc,
    internetFacing: true,
  });

  const listener = loadBalancer.addListener(`${service.name}-lb-listener`, { port: 80 });

  const targetGroup1 = listener.addTargets(`${service.name}-tg-1`, {
    port: 80,
    targets: [
      ecsService.loadBalancerTarget({
        containerName: `${service.name}-ecs-container`,
        containerPort: service.containerPort,
      }),
    ],
  });

  const targetGroup2 = new elbv2.ApplicationTargetGroup(scope, `${service.name}-tg-2`, {
    vpc,
    port: 80,
  });

  const application = new codedeploy.EcsApplication(scope, `${service.name}-application`, {
    applicationName: `${service.name}-application`,
  });

  return {
    loadBalancer,
    container,
    serviceName: service.name,
  };
}
