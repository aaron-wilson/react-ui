import * as cdk from "aws-cdk-lib";
import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { parseConfig } from "./config.js";
import { UiStack } from "./stack.js";
const fixture = {
  PLATFORM_ACCOUNT: "111111111111",
  PLATFORM_REGION: "us-east-1",
  PLATFORM_ENV: "demo",
  PLATFORM_SITE_ORIGIN: "https://wander.example",
  UI_CERTIFICATE_ARN:
    "arn:aws:acm:us-east-1:111111111111:certificate/00000000-0000-4000-8000-000000000000",
};
it("requires matching-account CloudFront certificates in us-east-1", () => {
  expect(() =>
    parseConfig({
      ...fixture,
      UI_CERTIFICATE_ARN: fixture.UI_CERTIFICATE_ARN.replace("us-east-1", "us-west-2"),
    })
  ).toThrow("UI_CERTIFICATE_ARN");
});
it("routes only known exports and preserves auth/share query strings", () => {
  const code = readFileSync(new URL("./routes.js", import.meta.url), "utf8");
  const request = (uri: string) => ({
    uri,
    querystring: { code: { value: "abc%2Fdef" }, state: { value: "s" } },
  });
  const route = (uri: string) =>
    runInNewContext(code + ";handler(event)", { event: { request: request(uri) } });
  for (const path of ["/", "/plan/", "/trip/", "/share/", "/docs/", "/auth/callback/"]) {
    expect(route(path).uri).toBe(path + "index.html");
    expect(route(path).querystring).toEqual(request(path).querystring);
  }
  expect(route("/share").headers.location.value).toBe("/share/?code=abc%2Fdef&state=s");
  for (const path of ["/missing", "/images/missing.webp", "/_next/static/missing.js", "/graphql"])
    expect(route(path).uri).toBe(path);
});
it("uses signed private S3 origin, bounded caches and real missing-page responses", () => {
  const t = cdk.assertions.Template.fromStack(
    new UiStack(new cdk.App(), "Ui", parseConfig(fixture))
  );
  t.resourceCountIs("AWS::Lambda::Function", 0);
  t.resourceCountIs("AWS::S3::Bucket", 0);
  t.hasResourceProperties("AWS::CloudFront::OriginAccessControl", {
    OriginAccessControlConfig: {
      SigningBehavior: "always",
      SigningProtocol: "sigv4",
      OriginAccessControlOriginType: "s3",
    },
  });
  t.hasResourceProperties("AWS::CloudFront::CachePolicy", {
    CachePolicyConfig: { DefaultTTL: 60, MinTTL: 0, MaxTTL: 300 },
  });
  t.hasResourceProperties("AWS::CloudFront::CachePolicy", {
    CachePolicyConfig: { DefaultTTL: 31536000 },
  });
  const dist = Object.values(t.findResources("AWS::CloudFront::Distribution"))[0].Properties
    .DistributionConfig;
  expect(dist.Origins[0].OriginAccessControlId).toBeDefined();
  expect(dist.CacheBehaviors[0].PathPattern).toBe("_next/static/*");
  expect(dist.CustomErrorResponses.map((e: { ResponseCode: number }) => e.ResponseCode)).toEqual([
    404, 404,
  ]);
  expect(
    dist.CustomErrorResponses.every(
      (e: { ResponsePagePath: string }) => e.ResponsePagePath === "/404.html"
    )
  ).toBe(true);
  const policy = Object.values(t.findResources("AWS::S3::BucketPolicy"))[0].Properties
    .PolicyDocument.Statement;
  expect(policy[0].Condition.Bool["aws:SecureTransport"]).toBe("false");
  expect(policy[1].Principal).toEqual({ Service: "cloudfront.amazonaws.com" });
  expect(policy[1].Action).toBe("s3:GetObject");
  expect(policy[1].Condition.StringEquals["AWS:SourceArn"]).toBeDefined();
});
