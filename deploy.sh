#! /bin/bash
npm install --silent --no-progress
ls
ls node_modules
cd $CODEBUILD_SRC_DIR/services/$service || exit
serverless deploy --stage $env --package \
$CODEBUILD_SRC_DIR/services/$service/target/$env -v -r $AWS_REGION
