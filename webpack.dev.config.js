const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

const BUILD_NUMBER = process.env.RUM_VERSION || 'dev';
const GLOBALS = {
  BUILD_NUMBER: JSON.stringify(BUILD_NUMBER),
};

module.exports = {
  mode: 'development',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'experience.js',
    publicPath: '/',
  },
  plugins: [
    new webpack.DefinePlugin({ ...GLOBALS }),
    new CleanWebpackPlugin(['dist']),
    new HtmlWebpackPlugin({
      title: 'Output Management',
      template: 'test.html',
      inject: false,
    }),
    new HtmlWebpackPlugin({
      filename: 'spa.html',
      template: 'testspa.html',
      inject: false,
    }),
    new HtmlWebpackPlugin({
      filename: 'e2e.html',
      template: 'e2e.html',
      inject: false,
    }),
    new HtmlWebpackPlugin({
      filename: 'large.html',
      template: 'large.html',
      inject: false,
    }),
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
};
