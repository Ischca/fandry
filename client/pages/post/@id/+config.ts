export default {
  // SSR enabled for SEO - dynamic title/description set via +Head.tsx
  ssr: true,
  // Pass data to client for hydration
  passToClient: ["routeParams", "data"],
};
