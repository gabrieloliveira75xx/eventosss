/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false, // Desabilita o modo estrito do React
    webpack(config, { isServer }) {
      // Ignora certos erros de Webpack
      config.ignoreWarnings = [
        (warning) =>
          warning.module?.resource?.includes('node_modules') && // Ignora erros de pacotes node_modules
          warning.message.includes('Critical dependency'),
      ];
  
      return config;
    },
    typescript: {
      ignoreBuildErrors: true, // Ignora erros de TypeScript no build
    },
    eslint: {
      ignoreDuringBuilds: true, // Ignora erros de ESLint durante o build
    },
  };
  
  export default nextConfig;
  