#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";

import { ClamavCdkStack } from "../lib/clamav-cdk-stack";

const app = new cdk.App();
new ClamavCdkStack(app, "ClamavCdkStack", {});
