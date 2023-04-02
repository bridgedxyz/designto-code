import { JsxWidget, StylableJsxWidget } from "@web-builder/core";
import { ReactComponentExportResult } from "@web-builder/react-core";
import {
  reactnative as rn_config,
  react as react_config,
} from "@grida/builder-config";
import { ReactNativeStyleSheetModuleBuilder } from "./rn-style-sheet-module-builder";

/**
 * standard `StyleSheet.create` pattern for react-native
 * @todo - this is not fully implemented
 * @param entry
 * @returns
 */
export function finalizeReactNativeWidget_StyleSheet(
  entry: JsxWidget,
  {
    styling,
    exporting,
  }: {
    styling: rn_config.ReactNativeStyleSheetConfig;
    exporting: react_config.ReactComponentExportingCofnig;
  }
): ReactComponentExportResult {
  const builder = new ReactNativeStyleSheetModuleBuilder({
    entry,
    config: styling,
  });
  return builder.asExportableModule().finalize(exporting);
}
