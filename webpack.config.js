const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

const BUILD_NUMBER = process.env.RUM_VERSION || 'dev';
const GLOBALS = {
  BUILD_NUMBER: JSON.stringify(BUILD_NUMBER),
};

module.exports = {
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'rum.js',
  },
  plugins: [
    new webpack.ExtendedAPIPlugin(),
    new webpack.DefinePlugin({ ...GLOBALS }),
  ],
  optimization: {
    minimizer: [new TerserPlugin({
      terserOptions: {
        compress: {},
        mangle: true,
      },
    })],
  },
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
