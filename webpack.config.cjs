const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: {
    taskpane: './taskpane/taskpane.js',
    'auth/login': './auth/auth.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js',
    clean: true
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    server: {
      type: 'https',
      options: {
        key: path.join(require('os').homedir(), '.office-addin-dev-certs', 'localhost.key'),
        cert: path.join(require('os').homedir(), '.office-addin-dev-certs', 'localhost.crt')
      }
    },
    port: 3000,
    hot: true,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    proxy: [
      {
        context: ['/api'],
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    ]
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './taskpane/taskpane.html',
      filename: 'taskpane/taskpane.html',
      chunks: ['taskpane']
    }),
    new HtmlWebpackPlugin({
      template: './auth/login.html',
      filename: 'auth/login.html',
      chunks: ['auth/login']
    }),
    new HtmlWebpackPlugin({
      template: './index.html',
      filename: 'index.html',
      chunks: []
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'assets', to: 'assets' },
        { from: 'payments', to: 'payments' },
        { from: 'taskpane/taskpane.css', to: 'taskpane/taskpane.css' },
        { from: 'manifest.production.xml', to: 'manifest.xml' }
      ]
    })
  ],
  resolve: {
    extensions: ['.js']
  },
  devtool: 'source-map'
};
