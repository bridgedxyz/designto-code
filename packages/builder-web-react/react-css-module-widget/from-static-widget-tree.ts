import { JsxWidget } from "@web-builder/core";
import { ReactComponentExportResult } from "@web-builder/react-core";
import { react as react_config } from "@grida/builder-config";
import { ReactCssModuleBuilder } from "./react-css-module-module-builder";

/**
 * css-module pattern with
 */
export function finalizeReactWidget_CssModule(
  entry: JsxWidget,
  {
    styling,
    exporting,
  }: {
    styling: react_config.ReactCssModuleConfig;
    exporting: react_config.ReactComponentExportingCofnig;
  }
): ReactComponentExportResult {
  const builder = new ReactCssModuleBuilder({ entry, config: styling });
  return builder.asExportableModule().finalize(exporting);
}
