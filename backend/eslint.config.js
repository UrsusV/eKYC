const js = require('@eslint/js');

module.exports = [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'commonjs',
            globals: {
                console: 'readonly',
                process: 'readonly',
                Buffer: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                exports: 'writable',
                module: 'writable',
                require: 'readonly',
                global: 'readonly',
                URL: 'readonly'
            }
        },
        rules: {
            'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
            'no-unused-vars': ['error', { argsIgnorePattern: 'next|req|res|err' }],
            'indent': ['error', 4],
            'quotes': ['error', 'single'],
            'semi': ['error', 'always']
        },
        ignores: ['node_modules/', 'dist/', 'build/', 'coverage/']
    }
];
