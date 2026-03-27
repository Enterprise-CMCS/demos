export function greet(name: string): string {
  return `Hello, ${name}!`;
}

export function hello(name: string): string {
  return greet(name);
}

export default greet;
