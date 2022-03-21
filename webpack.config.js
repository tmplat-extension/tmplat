const crypto = require('crypto');
const path = require('path');
const sass = require('sass');
const { EnvironmentPlugin } = require('webpack');
const { merge } = require('webpack-merge');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

const commonConfig = {
  entry: {
    'lib/content/any-content': './src/lib/content/any-content/index.ts',
    'lib/content/homepage-content': './src/lib/content/homepage-content/index.ts',
    'lib/ui/migrate': './src/lib/ui/migrate/index.ts',
    'lib/ui/options': './src/lib/ui/options/index.ts',
    'lib/ui/popup': './src/lib/ui/popup/index.ts',
    'lib/worker/background': './src/lib/worker/background/index.ts',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.s[ac]ss$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'sass-loader',
            options: {
              implementation: sass,
            },
          },
        ],
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, 'dist/temp'),
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    plugins: [new TsconfigPathsPlugin()],
  },
};

const developmentConfig = {
  devtool: 'inline-source-map',
  plugins: [
    new EnvironmentPlugin({
      EXTENSION_VERSION_HASH: crypto.randomUUID(),
    }),
  ],
};

const productionConfig = {
  devtool: 'source-map',
  plugins: [
    new EnvironmentPlugin({
      EXTENSION_VERSION_HASH: '',
    }),
  ],
};

module.exports = (env, { mode }) => {
  switch (mode) {
    case 'development':
      return merge(commonConfig, developmentConfig, { mode });
    case 'production':
      return merge(commonConfig, productionConfig, { mode });
    default:
      throw new Error(`Webpack mode is not supported: '${mode}'`);
  }
};
