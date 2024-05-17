# fovus-coding-challenge
The project description is at https://bit.ly/fovus-coding

Steps:
1. ``npm install -g aws-cdk``
2. Install AWS Cli https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
3. Use ``aws configure`` to add manually generated access key for your AWS account or follow this guide (https://docs.aws.amazon.com/sdkref/latest/guide/access-sso.html) to configure authentication using single-sign-on.
4. run ``npm install`` in both frontend and backend directories.
5. Configure backend ``.env`` using ``.env.example``.
6. Deploy backend using ``run.bat`` or ``run.sh``.
7. Copy values from outputs of cdk deploy and configure frontend ``.env`` using ``.env.example``.
8. Run frontend using ``npm start`` or build it ``npm build`` and deploy the created /dist folder.


References:
1. https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html
2. https://docs.aws.amazon.com/cdk/v2/guide/work-with-cdk-typescript.html
3. https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3-readme.html
4. https://bobbyhadz.com/blog/aws-cdk-lambda-function-example
5. https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_dynamodb-readme.html
6. https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/welcome.html
7. https://docs.aws.amazon.com/cognito/latest/developerguide/getting-started-test-application-react.html
8. https://bobbyhadz.com/blog/aws-cdk-cognito-user-pool-example
9. https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cognito.UserPoolClient.html
10. https://www.alexkates.dev/blog/how-to-trigger-an-aws-lambda-function-from-a-dynamodb-stream-event