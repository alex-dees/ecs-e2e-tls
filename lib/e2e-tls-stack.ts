import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as elb from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';

export class E2ETlsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //const vpc = new ec2.Vpc(this, 'Vpc');

    const app = new DockerImageAsset(this, 'App', {
      // directory: path.join(__dirname, '../src/app')
      directory: 'src/app'
    });

    const proxy = new DockerImageAsset(this, 'Proxy', {
      directory: 'src/proxy'
    });

    const cert = Certificate.fromCertificateArn(this, 'Cert', 
      'arn:aws:acm:us-east-1:844540003076:certificate/4fe693fd-6195-438d-acf5-7d3f59198871');

    const service = new patterns.ApplicationLoadBalancedFargateService(this, 'Service', {
      certificate: cert,
      targetProtocol: elb.ApplicationProtocol.HTTPS,
      taskImageOptions: {
        image: ecs.ContainerImage.fromDockerImageAsset(app)
      }
    });
    service.targetGroup.configureHealthCheck({
      path: '/service'
    })
    
    const sideCar = service.taskDefinition.addContainer('Sidecar', {
      image: ecs.ContainerImage.fromDockerImageAsset(proxy)
    });

    sideCar.addPortMappings({
      hostPort: 443,
      containerPort: 443
    })
  }
}
