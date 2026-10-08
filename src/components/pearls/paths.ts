/** The product's own pages. Downstairs (research, older versions) is everything else. */
export const isProductPath = (p: string) => p === "/" || p === "/explore" || p === "/play" || p === "/mine" || p.startsWith("/pearl/");
