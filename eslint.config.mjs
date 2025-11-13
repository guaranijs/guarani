import { defineConfig } from 'eslint/config';
import jest from 'eslint-plugin-jest';
import prettier from 'eslint-plugin-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import neostandard, { resolveIgnoresFromGitignore } from 'neostandard';

import nx from '@nx/eslint-plugin';

export default defineConfig([
    ...nx.configs['flat/base'],
    ...nx.configs['flat/typescript'],
    ...nx.configs['flat/javascript'],
    ...neostandard({
        ignores: resolveIgnoresFromGitignore(),
        semi: true,
        noStyle: true,
        noJsx: true,
        ts: true,
    }),
    {
        ignores: ['**/dist'],
    },
    {
        files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
        rules: {
            '@nx/enforce-module-boundaries': [
                'error',
                {
                    enforceBuildableLibDependency: true,
                    allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
                    depConstraints: [
                        {
                            sourceTag: '*',
                            onlyDependOnLibsWithTags: ['*'],
                        },
                    ],
                },
            ],
        },
    },
    {
        files: ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts', '**/*.js', '**/*.jsx', '**/*.cjs', '**/*.mjs'],
        plugins: { prettier, 'simple-import-sort': simpleImportSort },
        languageOptions: { globals: globals.node },
        rules: {
            'simple-import-sort/imports': [
                'error',
                {
                    groups: [
                        ['^\\u0000'],
                        ['^\\w'],
                        ['^@\\w'],
                        ['^\\.\\.(?!/?$)', '^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)'],
                    ],
                },
            ],
            'simple-import-sort/exports': 'error',
            'import-x/first': 'error',
            'import-x/newline-after-import': 'error',
            'import-x/no-duplicates': 'error',
            'prettier/prettier': 'error',
        },
    },
    {
        files: ['**/*.spec.ts', '**/*.spec.tsx', '**/*.spec.js', '**/*.spec.jsx'],
        ...jest.configs['flat/recommended'],
        plugins: { jest },
        languageOptions: {
            globals: { ...globals.jest, ...jest.environments.globals.globals },
        },
    },
]);
