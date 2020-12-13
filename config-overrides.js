const path = require('path');
const {
  override,
  addDecoratorsLegacy,
  addLessLoader,
  fixBabelImports,
  addWebpackAlias,
  overrideDevServer,
  addPostcssPlugins,
  addBundleVisualizer,
  addWebpackPlugin,
  adjustStyleLoaders,
} = require('customize-cra');

const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');
const WebpackBar = require('webpackbar');
const DashboardPlugin = require('webpack-dashboard/plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');

const resolve = (dir) => path.resolve(__dirname, dir);
const join = (dir) => path.join(__dirname, dir);

const isProduction = process.env.NODE_ENV === 'production';

function invade(target, name, callback) {
  target.forEach((item) => {
    if (item.constructor.name === name) {
      callback(item);
    }
  });
}

// 自定义配置
const addCustomize = () => (config) => {
  console.log(config.devtool);
  config.output.publicPath = '/';
  if (!isProduction) {
    // 循环检测工具
    config.plugins.push(
      new CircularDependencyPlugin({
        exclude: /node_modules/,
        include: /src/,
        failOnError: true,
        allowAsyncCycles: false,
        cwd: process.cwd(),
      }),
      // 本地日志输出
      new DashboardPlugin()
    );
  }
  if (isProduction) {
    invade(config.optimization.minimizer, 'TerserPlugin', (e) => {
      // 去除 LICENSE.txt
      e.options.extractComments = false;
      // 去除生产环境 console.log
      e.options.terserOptions.compress.drop_console = true;
    });

    // 美化打包后 js 文件名
    config.output.chunkFilename = config.output.chunkFilename.replace(
      '.chunk',
      ''
    );
    // 美化打包后 css 文件名
    invade(config.plugins, 'MiniCssExtractPlugin', (e) => {
      e.options.chunkFilename = e.options.chunkFilename.replace('.chunk', '');
    });

    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        libs: {
          name: 'chunk-libs',
          test: /[\\/]node_modules[\\/]/,
          priority: 10,
          chunks: 'initial', // only package third parties that are initially dependent
        },
        commons: {
          name: 'chunk-commons',
          test: resolve('src/components'), // can customize your rules
          minChunks: 3, //  minimum common number
          priority: 5,
          reuseExistingChunk: true,
        },
      },
    };

    config.plugins.push(
      new ScriptExtHtmlWebpackPlugin({
        // `runtime` must same as runtimeChunk name. default is `runtime`
        inline: /runtime\..*\.js$/,
      })
    );
    config.optimization.runtimeChunk = 'single';
  }

  return config;
};

// devserver 配置
const devServerConfig = () => (config) => {
  return {
    ...config,
    // 服务开启gzip
    compress: true,
    proxy: {
      '/api': {
        target: 'xxx',
        changeOrigin: true,
        pathRewrite: {
          '^/api': '/api',
        },
      },
    },
  };
};

module.exports = {
  webpack: override(
    // 增加别名
    addWebpackAlias({
      '@': resolve(__dirname, 'src'),
    }),

    // 增加装饰器
    addDecoratorsLegacy(),

    // 添加 less 的使用
    addLessLoader({
      additionalData: `@import "${join('./src/styles/global.less')}";`,
      lessOptions: {
        strictMath: true,
        noIeCompat: true,
        modifyVars: {},
        cssLoaderOptions: {},
        cssModules: {
          localIdentName: '[path][name]__[local]--[hash:base64:5]',
        },
      },
    }),

    // 按需引入组件
    fixBabelImports('import', {
      libraryName: 'ppfish-mobile', // 组件库名称
      libraryDirectory: 'es/components', // 组件所在目录
      camel2DashComponentName: false, // 是否自动转换组件名称
      style: true,
    }),

    // postcss 插件
    addPostcssPlugins([
      require('postcss-px-to-viewport')({
        viewportWidth: 375, // 视窗的宽度，对应的是我们设计稿的宽度，一般是375
        unitPrecision: 3, // 指定`px`转换为视窗单位值的小数位数（很多时候无法整除）
        viewportUnit: 'vw', // 指定需要转换成的视窗单位，建议使用 vw
        selectorBlackList: [], // 指定不转换为视窗单位的类，可以自定义，可以无限添加,建议定义一至两个通用的类名
        minPixelValue: 1, // 小于或等于`1px`不转换为视窗单位，你也可以设置为你想要的值
        mediaQuery: false, // 允许在媒体查询中转换`px`
        exclude: [/node_modules/],
        propList: ['*', '!border-radius'],
      }),
      require('postcss-normalize')({
        forceImport: true,
      }),
    ]),

    process.env.REACT_APP_BUNDLE_VISUALIZE == 1 &&
      addBundleVisualizer({
        analyzerMode: 'server',
      }),

    addCustomize(),

    addWebpackPlugin(
      // 进度条
      new WebpackBar({
        profile: true,
      })
    ),

    // 开发模式下生成  css souceMap
    !isProduction &&
      adjustStyleLoaders(({ use: [, css, postcss, resolve, processor] }) => {
        css.options.sourceMap = true; // css-loader
        postcss.options.sourceMap = true; // postcss-loader
        if (resolve) {
          resolve.options.sourceMap = true; // resolve-url-loader
        }
        // pre-processor
        if (processor && processor.loader.includes('less-loader')) {
          processor.options.sourceMap = true; // sass-loader
        }
      })
  ),
  devServer: overrideDevServer(devServerConfig()),

  paths: function (paths, env) {
    // 配置打包后的文件位置
    let dir = process.env.BUILD_PATH || 'dist';
    paths.appBuild = join(dir);
    return paths;
  },
};
