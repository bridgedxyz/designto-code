// universal
// export * as universal from "./universal";
import type { Language } from "@grida/builder-platform-types";
import type { ReactFrameworkConfig } from "../framework-react";
import type { ReactNativeFrameworkConfig } from "../framework-reactnative";
import type { SolidFrameworkConfig } from "../framework-solid";
import type { VanillaFrameworkConfig } from "../framework-vanilla";
import type { VanillaPreviewFrameworkConfig } from "../framework-vanilla-preview";

/**
 * Define your framework configuration for the builder.
 * (Part of `BuilderConfig#framework` )
 *
 * @example
 * ```ts
 * {
 *    framework: "react",
 *    language: Language.tsx,
 *    ...
 * }
 * ```
 */
export type FrameworkConfig =
  | ReactFrameworkConfig
  | ReactNativeFrameworkConfig
  | SolidFrameworkConfig
  | FlutterFrameworkConfig
  | VanillaFrameworkConfig
  | VanillaPreviewFrameworkConfig;

export type { ReactFrameworkConfig };
export type { ReactNativeFrameworkConfig };
export type { SolidFrameworkConfig };
export type { VanillaFrameworkConfig };
export type { VanillaPreviewFrameworkConfig };

export interface FlutterFrameworkConfig {
  framework: "flutter";
  language: Language.dart;
}

export * as android from "../framework-android";
export * as flutter from "../framework-flutter";
export * as ios from "../framework-ios";
export * as react from "../framework-react";
export * as reactnative from "../framework-reactnative";
export * as vanilla from "../framework-vanilla";
export * as preview from "../framework-vanilla-preview";
export * as vue from "../framework-vue";
export * as solid from "../framework-solid";
