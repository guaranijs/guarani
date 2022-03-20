if (Reflect == null || !('getMetadata' in Reflect)) {
  throw new Error(`@guarani/jose requires a Reflect Metadata polyfill.`);
}
