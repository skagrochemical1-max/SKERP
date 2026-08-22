import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        dashboard: resolve(__dirname, 'pages/dashboard.html'),
        products: resolve(__dirname, 'pages/products.html'),
        inventory: resolve(__dirname, 'pages/inventory.html'),
        clients: resolve(__dirname, 'pages/clients.html'),
        suppliers: resolve(__dirname, 'pages/suppliers.html'),
        purchases: resolve(__dirname, 'pages/purchases.html'),
        orders: resolve(__dirname, 'pages/orders.html'),
        formulations: resolve(__dirname, 'pages/formulations.html'),
        daily_transactions: resolve(__dirname, 'pages/daily-transactions.html'),
        calculator: resolve(__dirname, 'pages/calculator.html'),
        batch_calculator: resolve(__dirname, 'pages/batch-calculator.html'),
        exports: resolve(__dirname, 'pages/exports.html'),
        profile: resolve(__dirname, 'pages/profile.html')
      }
    }
  }
});
