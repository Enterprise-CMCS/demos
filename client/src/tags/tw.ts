// Provides a tag for tailwind classes to be used in the template literals
// This allows for better syntax highlighting in IDEs
export const tw = (str: TemplateStringsArray): string => {
  return str
    .flatMap((input) => input.split(/\s+/g))
    .filter(Boolean)
    .join(" ");;
};
