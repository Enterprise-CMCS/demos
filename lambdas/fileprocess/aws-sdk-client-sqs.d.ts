declare module "@aws-sdk/client-sqs" {
  export class SQSClient {
    constructor(config?: Record<string, unknown>);
    send(command: unknown): Promise<{ MessageId?: string }>;
  }

  export class SendMessageCommand {
    input: {
      QueueUrl?: string;
      MessageBody?: string;
    };
    constructor(input: { QueueUrl?: string; MessageBody?: string });
  }
}
