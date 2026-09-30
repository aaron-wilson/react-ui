import * as cdk from "aws-cdk-lib";
import type { Construct } from "constructs";
import { fileURLToPath } from "node:url";
import type { UiConfig } from "./config.js";
const {
  aws_cloudfront: cf,
  aws_cloudfront_origins: origins,
  aws_s3: s3,
  aws_ssm: ssm,
  aws_certificatemanager: acm,
} = cdk;
export class UiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, c: UiConfig) {
    super(scope, id, { env: { account: c.PLATFORM_ACCOUNT, region: c.PLATFORM_REGION } });
    const prefix = `/wander/${c.PLATFORM_ENV}/v1`;
    const name = ssm.StringParameter.valueForStringParameter(this, `${prefix}/ui/bucket-name`);
    const bucket = s3.Bucket.fromBucketName(this, "Bucket", name);
    const oac = new cf.CfnOriginAccessControl(this, "Oac", {
      originAccessControlConfig: {
        name: `wander-${c.PLATFORM_ENV}-ui`,
        originAccessControlOriginType: "s3",
        signingBehavior: "always",
        signingProtocol: "sigv4",
      },
    });
    const origin = origins.S3BucketOrigin.withBucketDefaults(bucket, {
      originAccessControlId: oac.ref,
    });
    const routing = new cf.Function(this, "Routes", {
      runtime: cf.FunctionRuntime.JS_2_0,
      code: cf.FunctionCode.fromFile({
        filePath: fileURLToPath(new URL("./routes.js", import.meta.url)),
      }),
    });
    const htmlCache = new cf.CachePolicy(this, "HtmlCache", {
      minTtl: cdk.Duration.seconds(0),
      defaultTtl: cdk.Duration.seconds(60),
      maxTtl: cdk.Duration.seconds(300),
      cookieBehavior: cf.CacheCookieBehavior.none(),
      queryStringBehavior: cf.CacheQueryStringBehavior.none(),
      enableAcceptEncodingGzip: true,
      enableAcceptEncodingBrotli: true,
    });
    const assetsCache = new cf.CachePolicy(this, "AssetsCache", {
      minTtl: cdk.Duration.days(365),
      defaultTtl: cdk.Duration.days(365),
      maxTtl: cdk.Duration.days(365),
      enableAcceptEncodingGzip: true,
      enableAcceptEncodingBrotli: true,
    });
    const distribution = new cf.Distribution(this, "Distribution", {
      domainNames: [c.domainName],
      certificate: acm.Certificate.fromCertificateArn(this, "Certificate", c.UI_CERTIFICATE_ARN),
      minimumProtocolVersion: cf.SecurityPolicyProtocol.TLS_V1_2_2021,
      defaultBehavior: {
        origin,
        viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cf.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachePolicy: htmlCache,
        functionAssociations: [
          { function: routing, eventType: cf.FunctionEventType.VIEWER_REQUEST },
        ],
      },
      additionalBehaviors: {
        "_next/static/*": {
          origin,
          viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: assetsCache,
        },
      },
      errorResponses: [403, 404].map((httpStatus) => ({
        httpStatus,
        responseHttpStatus: 404,
        responsePagePath: "/404.html",
        ttl: cdk.Duration.seconds(10),
      })),
    });
    new s3.CfnBucketPolicy(this, "BucketPolicy", {
      bucket: name,
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Deny",
            Principal: "*",
            Action: "s3:*",
            Resource: [bucket.bucketArn, bucket.arnForObjects("*")],
            Condition: { Bool: { "aws:SecureTransport": "false" } },
          },
          {
            Effect: "Allow",
            Principal: { Service: "cloudfront.amazonaws.com" },
            Action: "s3:GetObject",
            Resource: bucket.arnForObjects("*"),
            Condition: {
              StringEquals: {
                "AWS:SourceArn": `arn:aws:cloudfront::${c.PLATFORM_ACCOUNT}:distribution/${distribution.distributionId}`,
              },
            },
          },
        ],
      },
    });
    new ssm.StringParameter(this, "DistributionParameter", {
      parameterName: `${prefix}/ui/distribution-id`,
      stringValue: distribution.distributionId,
    });
    new cdk.CfnOutput(this, "DistributionId", { value: distribution.distributionId });
    new cdk.CfnOutput(this, "DistributionDomain", { value: distribution.distributionDomainName });
  }
}
