import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as elb from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';

export class E2ETlsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'Vpc');

    const app = new DockerImageAsset(this, 'App', {
      directory: 'src/app'
    });

    const proxy = new DockerImageAsset(this, 'Proxy', {
      directory: 'src/proxy'
    });
   
    const cert = Certificate.fromCertificateArn(this, 'Cert',
      ssm.StringParameter.valueForStringParameter(this, 'cert-arn'));
      
    const service = new ApplicationLoadBalancedFargateService(this, 'Service', {
      vpc,
      certificate: cert,
      publicLoadBalancer: false,
      targetProtocol: elb.ApplicationProtocol.HTTPS,
      taskImageOptions: {
        containerPort: 443,
        image: ecs.ContainerImage.fromDockerImageAsset(proxy)
        //image: ecs.ContainerImage.fromEcrRepository(repo, 'proxy')
      }
    });
    
    service.loadBalancer.addSecurityGroup(ec2.SecurityGroup
      .fromSecurityGroupId(this, 'VpcSg', vpc.vpcDefaultSecurityGroup));

    service.targetGroup.configureHealthCheck({
      path: '/service'
    });
  
    const appDef = service.taskDefinition.addContainer('App', {
      image: ecs.ContainerImage.fromDockerImageAsset(app),
      logging: ecs.LogDriver.awsLogs({ streamPrefix: 'app' })
      //image: ecs.ContainerImage.fromEcrRepository(repo, 'app')
    });

    appDef.addPortMappings({
      containerPort: 8080
    });
  }
}
