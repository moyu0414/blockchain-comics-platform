const webpack = require("webpack");
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = function override(config) {
  const fallback = config.resolve.fallback || {};
  Object.assign(fallback, {
    fs: false,
    querystring: false,
    path: false,
    crypto: false,
    stream: false,
    assert: false,
    http: false,
    https: false,
    os: false,
    url: false,
    zlib: false,
  });
  config.resolve.fallback = fallback;

  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: "process/browser",
      Buffer: ["buffer", "Buffer"],
    }),
    // 添加 CopyWebpackPlugin 插件
    new CopyWebpackPlugin({
      patterns: [
        { from: path.resolve(__dirname, 'serverjs/uploads'), to: 'serverjs/uploads' } // 复制 uploads 文件夹
      ]
    }),
  ]);

  config.ignoreWarnings = [/Failed to parse source map/];

  config.module.rules.push({
    test: /\.(js|mjs|jsx)$/,
    enforce: "pre",
    loader: require.resolve("source-map-loader"),
    resolve: {
      fullySpecified: false,
    },
  });

  // 确保处理静态资源
  config.module.rules.push({
    test: /\.(png|jpg|jpeg|gif|svg)$/,
    use: [
      {
        loader: 'file-loader',
        options: {
          name: '[name].[hash:8].[ext]',
          outputPath: 'static/media/',
          publicPath: '/static/media/',
        },
      },
    ],
  });

  return config;
};
