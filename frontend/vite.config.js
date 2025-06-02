export default {
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: ['mitarbeiterportal-frontend', 'localhost', '127.0.0.1'],
    proxy: {
      '/api': {
        target: 'http://localhost:5050',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, '')
      }
    }
  }
};
