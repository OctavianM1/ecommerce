import { Stack, StackProps, Stage, StageProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as pipelines from 'aws-cdk-lib/pipelines';

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const pipeline = new pipelines.CodePipeline(this, 'test-pipeline', {
      synth: new pipelines.ShellStep('Synth', {
        input: pipelines.CodePipelineSource.connection('OctavianM1/ecommerce', 'release', {
          connectionArn:
            'arn:aws:codestar-connections:eu-central-1:656983766737:connection/64fef60c-b47b-4928-8044-1f861c8dbdde',
        }),
        commands: ['cd infrastructure', 'npm ci', 'npm run build', 'npx cdk synth'],
        primaryOutputDirectory: 'infrastructure',
      }),
    });

    pipeline.addStage(new MyApplication(this, 'test-env'));
  }
}

class MyApplication extends Stage {
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    new BasketService(this, 'basket-service-stack');
  }
}

class BasketService extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const vpc = new ec2.Vpc(this, 'services-vpc', {
      maxAzs: 2,
      subnetConfiguration: [{ name: 'Public', subnetType: ec2.SubnetType.PUBLIC, cidrMask: 24 }],
    });

    const cluster = new ecs.Cluster(this, 'basket-service-ecs-cluster', {
      vpc,
    });

    cluster.addCapacity('basket-service-ecs-capacity', {
      instanceType: new ec2.InstanceType('t2.micro'),
      minCapacity: 1,
      desiredCapacity: 2,
      maxCapacity: 3,
    });

    const taskDefinition = new ecs.Ec2TaskDefinition(this, 'basket-service-task-definition', {
      family: 'basket-service-task-definition',
    });

    const basketEcrRepo = ecr.Repository.fromRepositoryName(
      this,
      'basket-service-repo-name',
      'basket-service'
    );
    const container = taskDefinition.addContainer('basket-service-ecs-container', {
      image: ecs.ContainerImage.fromEcrRepository(basketEcrRepo, 'latest'),
      memoryReservationMiB: 216,
      cpu: 216,
      environment: { PORT: '3100' },
      portMappings: [{ containerPort: 3100, hostPort: 0 }],
    });

    const service = new ecs.Ec2Service(this, 'basket-service-ecs-service', {
      cluster,
      taskDefinition,
      desiredCount: 2,
      deploymentController: {
        type: ecs.DeploymentControllerType.CODE_DEPLOY,
      },
    });

    const loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'basket-service-load-balancer', {
      vpc,
      internetFacing: true,
    });

    const listener = loadBalancer.addListener('basket-service-lb-listener', { port: 80 });

    const targetGroup1 = listener.addTargets('basket-service-tg-1', {
      port: 80,
      targets: [
        service.loadBalancerTarget({
          containerName: 'basket-service-ecs-container',
          containerPort: 3100,
        }),
      ],
    });

    const targetGroup2 = new elbv2.ApplicationTargetGroup(this, 'basket-service-tg-2', {
      vpc,
      port: 80,
    });

    const application = new codedeploy.EcsApplication(this, 'basket-service-application', {
      applicationName: 'basket-service-application',
    });

    const deploymentGroup = codedeploy.EcsDeploymentGroup.fromEcsDeploymentGroupAttributes(
      this,
      'basket-service-deployment-group',
      {
        application,
        deploymentGroupName: 'basket-service-deployment-group',
      }
    );
  }
}
