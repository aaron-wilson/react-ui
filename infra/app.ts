import * as cdk from "aws-cdk-lib";
import { parseConfig } from "./config.js";
import { UiStack } from "./stack.js";
const config = parseConfig(process.env);
const app = new cdk.App();
new UiStack(app, `Wander${config.PLATFORM_ENV}Ui`, config);
app.synth();
