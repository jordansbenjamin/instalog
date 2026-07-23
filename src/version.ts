import packageMetadata from "../package.json";

// The root package metadata is the product-version source of truth. Keeping
// this export means UI and feedback code do not need to know where it lives.
export const APP_VERSION = packageMetadata.version;
