set -e

BUCKET=$1
CF_DISTRIBUTION=$2
AWS_OPT=""

echo "Deploying script to S3 bucket: $BUCKET using Cloudfront distribution ID: $CF_DISTRIBUTION"

HEAD=$(git rev-parse HEAD)
cat > invalidation.json <<- EOM
{
  "Paths": {
    "Quantity": 1,
    "Items": ["/experience.js*"]
  },
  "CallerReference": "$HEAD"
}
EOM

# Build script
./build.sh

aws s3 sync ./dist/ s3://$BUCKET $AWS_OPT

aws cloudfront create-invalidation \
    --invalidation-batch file://invalidation.json \
    --distribution-id $CF_DISTRIBUTION

echo 'Success!'
