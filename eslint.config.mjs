import cwv from "eslint-config-next/core-web-vitals";
import ts from "eslint-config-next/typescript";

const config = [
  { ignores: [".next/**", "node_modules/**", "legacy/**", "next-env.d.ts"] },
  ...cwv,
  ...ts,
];

export default config;
