import messages from "../../messages/mn.json";

type KeyPaths<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${KeyPaths<T[K]>}`;
}[keyof T & string];

export type MessageKey = KeyPaths<typeof messages>;

export function t(key: MessageKey): string {
  const value = key
    .split(".")
    .reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], messages);

  if (typeof value !== "string") {
    throw new Error(`Missing message for key "${key}"`);
  }
  return value;
}
