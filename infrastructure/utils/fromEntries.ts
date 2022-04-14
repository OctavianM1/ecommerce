export function fromEntires<T = unknown>(entries: [string, T][], prefix?: string) {
  const output: { [key: string]: string | T } = {};
  entries.forEach((e) => {
    const key = prefix ? `${prefix}${e[0]}` : e[0];
    output[key] = e[1];
  });
  return output;
}
