declare module "saxen" {
  export class Parser {
    on(event: "openTag", handler: (
      name: string,
      attributes: () => Record<string, string>,
      decode: (value: string) => string,
      selfClosing: boolean,
    ) => void): this;
    on(event: "closeTag", handler: (name: string) => void): this;
    on(event: "error" | "warn", handler: (error: Error) => void): this;
    parse(xml: string): Error | null;
  }
}