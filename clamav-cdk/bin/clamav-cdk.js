#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const cdk = __importStar(require("aws-cdk-lib"));
const clamav_cdk_stack_1 = require("../lib/clamav-cdk-stack");
const app = new cdk.App();
new clamav_cdk_stack_1.ClamavCdkStack(app, "ClamavCdkStack", {});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xhbWF2LWNkay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNsYW1hdi1jZGsudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSxpREFBbUM7QUFFbkMsOERBQXlEO0FBRXpELE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQzFCLElBQUksaUNBQWMsQ0FBQyxHQUFHLEVBQUUsZ0JBQWdCLEVBQUUsRUFBRSxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiBub2RlXG5pbXBvcnQgKiBhcyBjZGsgZnJvbSBcImF3cy1jZGstbGliXCI7XG5cbmltcG9ydCB7IENsYW1hdkNka1N0YWNrIH0gZnJvbSBcIi4uL2xpYi9jbGFtYXYtY2RrLXN0YWNrXCI7XG5cbmNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKCk7XG5uZXcgQ2xhbWF2Q2RrU3RhY2soYXBwLCBcIkNsYW1hdkNka1N0YWNrXCIsIHt9KTtcbiJdfQ==