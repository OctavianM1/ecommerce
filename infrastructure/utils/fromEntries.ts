export function fromEntires<T = unknown>(entries: [string, T][], prefix?: string) {
  const output: { [key: string]: string | T } = {};
  entries.forEach((e) => {
    const val = prefix ? `${prefix}${e[1]}` : e[1];
    output[e[0]] = val;
  });
  return output;
}
