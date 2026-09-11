export const siteConfig = {
  name: "Zelleroa",
  description: "Elevate your style with Zelleroa - Premium dresses, ethnic wear, and modern fashion delivered to your doorstep.",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
};

export const productConfig = {
  itemsPerPage: 12,
  maxItemsPerPage: 100,
  defaultSort: "newest",
  defaultView: "grid",
};

export const adminConfig = {
  itemsPerPage: 20,
  maxItemsPerPage: 100,
};
