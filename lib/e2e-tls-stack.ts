import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as elb from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';

export class E2ETlsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //const vpc = new ec2.Vpc(this, 'Vpc');
    //const repo = new ecr.Repository(this, 'Repo');
    const app = new DockerImageAsset(this, 'App', {
      directory: path.join(__dirname, '../src/app')
    });
    // const proxy = new DockerImageAsset(this, 'Proxy', {
    //   directory: 'src/proxy'
    // });
    /*
    const service = new patterns
      .ApplicationLoadBalancedFargateService(
        this, 
        'Service', {
          // vpc,
          // targetProtocol: elb.ApplicationProtocol.HTTPS
        });
    */
  }
}
