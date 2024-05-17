import * as cdk from 'aws-cdk-lib';

import * as AWSS3 from 'aws-cdk-lib/aws-s3';
import * as AWSDynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as AWSLambda from 'aws-cdk-lib/aws-lambda';
import * as AWSIam from 'aws-cdk-lib/aws-iam';
import * as AWSApiGateway from 'aws-cdk-lib/aws-apigateway';
import * as AWSCognito from 'aws-cdk-lib/aws-cognito';

import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Construct } from 'constructs';

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const EC2_SCRIPT_NAME = process.env.EC2_SCRIPT_NAME || "ec2-script.py"

    // Create Input Bucket
    const userUploadBucket = new AWSS3.Bucket(this, "fovus-input-bucket", {
      bucketName: process.env.INPUT_BUCKET_NAME || "fovus-bucket-input",
      publicReadAccess: false,
      blockPublicAccess: AWSS3.BlockPublicAccess.BLOCK_ACLS,
      accessControl: AWSS3.BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
      cors: [
        {
          allowedOrigins: [process.env.CORS_ORIGIN || ""],
          allowedMethods: [AWSS3.HttpMethods.POST, AWSS3.HttpMethods.HEAD],
          allowedHeaders: ["*"]
        }
      ]
    },
    )
    userUploadBucket.grantWrite(new AWSIam.AnyPrincipal());
    userUploadBucket.grantRead(new AWSIam.ServicePrincipal("ec2.amazonaws.com"))

    // Print bucket url and name to copy to out frontend environment
    new cdk.CfnOutput(this, 'userUploadBucketName', {
      value: userUploadBucket.bucketName
    });
    new cdk.CfnOutput(this, 'userUploadBucketUrl', {
      value: userUploadBucket.urlForObject()
    });


    // Create Output Bucket
    const outputBucket = new AWSS3.Bucket(this, "fovus-output-bucket", {
      bucketName: process.env.OUTPUT_BUCKET_NAME || "fovus-bucket-output",
      publicReadAccess: false,
      blockPublicAccess: AWSS3.BlockPublicAccess.BLOCK_ACLS,
      accessControl: AWSS3.BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
    }
    )
    outputBucket.grantWrite(new AWSIam.ServicePrincipal("ec2.amazonaws.com"))

    // Create DynamoDB table
    const userInputTable = new AWSDynamodb.Table(this, "UserInputTable", {
      partitionKey: { name: 'id', type: AWSDynamodb.AttributeType.STRING },
      stream: AWSDynamodb.StreamViewType.NEW_IMAGE,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create a Lambda function to run ec2 clients
    const runEc2Lambda = new AWSLambda.Function(this, 'RunEC2', {
      runtime: AWSLambda.Runtime.NODEJS_LATEST,
      handler: 'ec2-run-instance-lambda.main',
      code: AWSLambda.Code.fromAsset("lib/lambda"),
      environment: {
        TABLE_NAME: userInputTable.tableName,
        INPUT_BUCKET_NAME: userUploadBucket.bucketName,
        OUTPUT_BUCKET_NAME: outputBucket.bucketName,
        EC2_SCRIPT_URL: userUploadBucket.urlForObject(EC2_SCRIPT_NAME)
      }
    })
    userInputTable.grantReadData(runEc2Lambda);

    // Grant the Lambda function permissions to create EC2 instances
    runEc2Lambda.addToRolePolicy(new AWSIam.PolicyStatement({
      actions: ['ec2:RunInstances'],
      resources: ['*'],
    }));

    // Add lambda as the target for DynamoDB inserts
    runEc2Lambda.addEventSource(new DynamoEventSource(userInputTable, {
      startingPosition: AWSLambda.StartingPosition.LATEST
    }))

    // Create Lambda for handling user input
    const userInputLambda = new AWSLambda.Function(this, "UserInput", {
      runtime: AWSLambda.Runtime.NODEJS_LATEST,
      handler: "process-file-lambda.main",

      code: AWSLambda.AssetCode.fromAsset("lib/lambda"),
      environment: {
        TABLE_NAME: userInputTable.tableName,
        CORS_ORIGIN: process.env.CORS_ORIGIN || ""
      },
    });

    // Allow lambda to write to the DynamoDB table
    userInputTable.grantWriteData(userInputLambda);

    // Create a get signed URL to upload to s3 buckets
    const getSignedURLLambda = new AWSLambda.Function(this, 'getSignedURL', {
      runtime: AWSLambda.Runtime.NODEJS_LATEST,
      handler: 'get-signed-url.main',
      code: AWSLambda.Code.fromAsset("lib/lambda"),
      environment: {
        INPUT_BUCKET_NAME: userUploadBucket.bucketName,
      }
    })

    // Create User Pool for Cognito
    const userPool = new AWSCognito.UserPool(this, 'fovus-userpool', {
      userPoolName: 'fovus-app-user-pool',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      passwordPolicy: {
        minLength: 6,
        requireLowercase: true,
        requireDigits: true,
        requireUppercase: false,
        requireSymbols: false,
      },
      accountRecovery: AWSCognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create cognito client ID for our frontend
    const userPoolClient = new AWSCognito.UserPoolClient(this, 'fovus-userpool-client', {
      userPool,
      authFlows: {
        userPassword: true
      },
      supportedIdentityProviders: [
        AWSCognito.UserPoolClientIdentityProvider.COGNITO,
      ]
    });

    // Output the client ID to copy to our frontend enviroment
    new cdk.CfnOutput(this, 'userPoolClientId', {
      value: userPoolClient.userPoolClientId,
    });

    // Create API gateway with the upload and get-signed-url lambda integrated to it along with cognito authorizer
    const apiGateway = new AWSApiGateway.RestApi(this, "InputAPI", {
      restApiName: "Input API",
    });
    const authorizer = new AWSApiGateway.CognitoUserPoolsAuthorizer(this, "user pool authorizer", {
      cognitoUserPools: [userPool],
    })

    // Add /signed endpoint
    const getSignedUrlApiIntegration = new AWSApiGateway.LambdaIntegration(getSignedURLLambda);
    const signed = apiGateway.root.addResource("signed")
    signed.addMethod("POST", getSignedUrlApiIntegration);

    // Add /userInput endpoint with cognito authorizer
    const userInputApiIntegration = new AWSApiGateway.LambdaIntegration(userInputLambda);
    const user = apiGateway.root.addResource("userInput")
    user.addMethod("POST", userInputApiIntegration, {
      authorizer: authorizer,
      authorizationType: AWSApiGateway.AuthorizationType.COGNITO,
    });
  }
}
