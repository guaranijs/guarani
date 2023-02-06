module.exports = {
  '*.{js,ts,json,html,css}': ['pnpm nx affected:lint --fix --files', 'pnpm nx format:write --files'],
};
