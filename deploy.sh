#! /bin/bash
npm install --save
cd $CODEBUILD_SRC_DIR/services/$service || exit
npm install --save
serverless deploy --stage $env --package \
$CODEBUILD_SRC_DIR/services/$service/target/$env -v -r $AWS_REGION
