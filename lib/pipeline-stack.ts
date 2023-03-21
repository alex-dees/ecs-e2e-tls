
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { E2ETlsStack } from './e2e-tls-stack';
import * as pipelines from 'aws-cdk-lib/pipelines';
import { BuildSpec } from 'aws-cdk-lib/aws-codebuild';

class AppStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);
    new E2ETlsStack(this, 'E2ETlsStack', props);
  }
}

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    const step = new pipelines.CodeBuildStep('Certs', {
      input: pipelines.CodePipelineSource.connection('alex-dees/ecs-e2e-tls', 'main', {
        connectionArn: 'arn:aws:codestar-connections:us-east-1:844540003076:connection/2f8ebd4e-dee4-4ebd-815b-8021abc56369'
      }),
      primaryOutputDirectory: '.',
      // partialBuildSpec: BuildSpec.fromObject({
      //   version: '0.2',
      //   env: {
      //     shell: 'bash'
      //   }
      // }),
      commands: [
        'cd src/proxy/certs',
        'chmod +x certs.sh',
        './certs.sh',
        //'ls -la',
      ],
      rolePolicyStatements: [
        new iam.PolicyStatement({
          actions: ['acm:*'],
          resources: ['*']
        })
      ]
    });

    const pipeline = new pipelines.CodePipeline(this, 'Pipeline', {
        synth: new pipelines.ShellStep('Synth', {
          // input: pipelines.CodePipelineSource.connection('alex-dees/ecs-e2e-tls', 'main', {
          //   connectionArn: 'arn:aws:codestar-connections:us-east-1:844540003076:connection/2f8ebd4e-dee4-4ebd-815b-8021abc56369'
          // }),
          input: step,          
          commands: [
            'npm ci',
            'npm run build',
            'npx cdk synth',
          ]
        })
    });
    pipeline.addStage(new AppStage(this, 'App', { env: props?.env }));
    // pipeline.addStage(new AppStage(this, 'App', { env: props?.env }), {
    //   pre: [
    //     new pipelines.ShellStep('Certs', {
    //       commands: [
    //         '. src/proxy/certs/certs.sh'
    //       ]
    //     })
    //   ]
    // });
  }
}
