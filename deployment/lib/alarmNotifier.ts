import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import {CloudWatchAlarmEvent} from "aws-lambda"

const ssm = new SSMClient({});

async function getParameter(name: string) {
  const response = await ssm.send(
    new GetParameterCommand({
      Name: name,
      WithDecryption: true,
    }),
  );

  return response.Parameter?.Value;
}

export const handler = async (event: CloudWatchAlarmEvent) => {
  const webhookUrl = await getParameter(`/demos/webhookUrl`);

  if (!webhookUrl || webhookUrl.trim() == "") {
    throw new Error("webhook url is missing");
  }

  const data = event.alarmData;
  console.log("Received alarm data:", JSON.stringify(data, null, 2));

  const gr = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: data.configuration.description,
      name: data.alarmName,
      state: data.state.value,
      reason: data.state.reason,
      previousState: data.previousState.value,
    }),
  });

  const body = await gr.text();
  const response = {
    statusCode: gr.status,
    body: body,
  };
  return response;
};
