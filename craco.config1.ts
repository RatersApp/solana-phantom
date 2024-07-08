import webpack from 'webpack';
import path from 'node:path';

function override(config, env) {
    //do stuff with the webpack config...

    config.resolve.fallback = {
         url: path.resolve('url'),
         assert: path.resolve('assert'),
         crypto: path.resolve('crypto-browserify'),
        'process/browser': path.resolve('process/browser'),
         http: path.resolve('stream-http'),
         https: path.resolve('https-browserify'),
         os: path.resolve('os-browserify/browser'),
         buffer: path.resolve('buffer'),
         stream: path.resolve('stream-browserify'),
    };
    
    config.plugins.push(
         new webpack.ProvidePlugin({
             process: 'process/browser',
             Buffer: ['buffer', 'Buffer'],
         }),
     );
     
 
    return config;
}

export default override;