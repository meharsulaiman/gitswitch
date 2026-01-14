const path = require('path');

module.exports = {
  entry: {
    webview: './src/ui/webview/app.tsx'
  },
  output: {
    path: path.resolve(__dirname, 'out', 'webview'),
    filename: '[name].js'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: 'tsconfig.webview.json'
          }
        },
        exclude: /node_modules/
      }
    ]
  },
  externals: {
    vscode: 'commonjs vscode'
  },
  target: 'web',
  mode: 'development',
  // Disable eval-based source maps to comply with VS Code CSP
  devtool: false,
  optimization: {
    minimize: false
  }
};
