/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack(config, { isServer }) {
      // A configuração `devtool` deve ser uma string válida de acordo com o padrão
      if (!isServer) {
        config.devtool = 'source-map'; // Usa 'source-map' para produção, se necessário
      }
      return config;
    },
    typescript: {
      ignoreBuildErrors: true, // Ignora erros de TypeScript durante o build
    },
    eslint: {
      ignoreDuringBuilds: true, // Ignora erros de ESLint durante a construção
    },
  };
  
  export default nextConfig;
  