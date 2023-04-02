import { handle } from "@coli.codes/builder";
import { ScopedVariableNamer } from "@coli.codes/naming";
import { Framework } from "@grida/builder-platform-types";
import { WidgetWithStyle } from "@web-builder/core";
import { JSXIdentifier } from "coli";
import {
  composeStyledComponentVariableDeclaration,
  NamePreference,
  NoStyleJSXElementConfig,
  StyledComponentJSXElementConfig,
} from "./core";

/**
 *
 * @param widget
 * @returns
 */
export function buildStyledComponentConfig(
  widget: WidgetWithStyle,
  preferences: {
    /**
     * nmaer passed to handle the variable naming
     */
    namer: ScopedVariableNamer;
    /**
     * rather to rename the tag or not
     */
    rename_tag: boolean;
    /**
     * assign suffix ("root wrapper") if root
     */
    transformRootName: boolean;
    context: {
      /**
       * if the element is a root element
       */
      root: boolean;
    };
    framework: Framework;
  }
): StyledComponentJSXElementConfig | NoStyleJSXElementConfig {
  const config = widget.jsxConfig() as StyledComponentJSXElementConfig;

  const namePref: NamePreference = {
    namer: preferences.namer,
    overrideKeyName:
      preferences.context.root &&
      preferences.transformRootName &&
      "root wrapper " + widget.key.name, // RootWrapper${name}
  };

  const styledVar = composeStyledComponentVariableDeclaration(widget, {
    name: namePref,
    framework: preferences.framework,
  });

  if (styledVar) {
    if (config.tag instanceof JSXIdentifier) {
      if (preferences.rename_tag) {
        // rename tag as styled component
        // e.g. `div` to `Wrapper`
        config.tag.rename(styledVar.id.name);
      }
    } else {
      console.error(
        `unhandled styled component conversion of widget type of ${typeof config}`,
        config
      );
    }

    return {
      id: styledVar.id.name,
      tag: handle(config.tag),
      attributes: config.attributes,
      style: widget.finalStyle,
      styledComponent: styledVar,
    };
  } else {
    return {
      id: undefined,
      tag: handle(config.tag),
      attributes: config.attributes,
    };
  }
}
