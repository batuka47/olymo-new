import messages from "../../messages/mn.json";

type KeyPaths<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${KeyPaths<T[K]>}`;
}[keyof T & string];

export type MessageKey = KeyPaths<typeof messages>;

/** Looks up a message; `{name}` placeholders are filled from `values`. */
export function t(key: MessageKey, values?: Record<string, string | number>): string {
  const message = key
    .split(".")
    .reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], messages);

  if (typeof message !== "string") {
    throw new Error(`Missing message for key "${key}"`);
  }
  if (!values) {
    return message;
  }
  return message.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    name in values ? String(values[name]) : placeholder,
  );
}
