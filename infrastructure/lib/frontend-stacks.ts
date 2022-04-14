import {
  NestedStack,
  NestedStackProps,
  SecretValue,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as amplify from '@aws-cdk/aws-amplify-alpha';
import * as iam from 'aws-cdk-lib/aws-iam';
import { fromEntires } from '../utils/fromEntries';

interface EShopUIStackProps extends NestedStackProps {
  env: { [key: string]: string };
}

export class EShopUIStack extends NestedStack {
  constructor(scope: Construct, props: EShopUIStackProps) {
    super(scope, 'eshop-ui-stack', props);
    const { env } = props;

    const nextAppEnv = fromEntires(Object.entries(env), 'NEXT_PUBLIC_');

    const amplifyRole = new iam.Role(this, 'amplify-role', {
      assumedBy: new iam.ServicePrincipal('amplify.amazonaws.com'),
    });
    amplifyRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess-Amplify'));

    const amplifyApp = new amplify.App(this, 'eshop-ui', {
      appName: 'eshop-ui',
      sourceCodeProvider: new amplify.GitHubSourceCodeProvider({
        owner: 'OctavianM1',
        repository: 'ecommerce',
        oauthToken: SecretValue.secretsManager('github-oauth-token'),
      }),
      role: amplifyRole,
      environmentVariables: {
        // NEXT_PUBLIC_BASKET_SERVICE: `http://${loadBalancer.loadBalancerDnsName}`,
        AMPLIFY_MONOREPO_APP_ROOT: 'apps/eshop-ui',
        ...nextAppEnv,
      },
    });
    amplifyApp.addBranch('release');
  }
}