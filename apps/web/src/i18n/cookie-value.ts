/** The value of one cookie in a `Cookie` header (`theme=dark; locale=pt`), or undefined. */
export const cookieValue = (header: string | null, name: string) =>
  header
    ?.split(";")
    .map((pair) => pair.trim())
    .find((pair) => pair.startsWith(`${name}=`))
    ?.slice(name.length + 1);
