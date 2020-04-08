#! /bin/bash
npm install -g serverless
npm install --save-dev serverless-bundle serverless-offline serverless-mocha-plugin
cd $CODEBUILD_SRC_DIR/services/$service || exit
serverless deploy --stage $env --package \
$CODEBUILD_SRC_DIR/services/$service/target/$env -v -r $AWS_REGION
