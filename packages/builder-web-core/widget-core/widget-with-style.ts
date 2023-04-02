import { JsxWidget, IMultiChildJsxWidget, JSXElementConfig } from ".";
import { ElementCssProperties, ElementCssStyleData } from "@coli.codes/css";
import {
  Color,
  DimensionLength,
  EdgeInsets,
  IBoxShadowWidget,
  IEdgeInsetsWidget,
  IPositionedWidget,
  IWHStyleWidget,
} from "@reflect-ui/core";
import { BoxShadowManifest } from "@reflect-ui/core";
import { Background } from "@reflect-ui/core";
import { WidgetKey } from "../widget-key";
import { positionAbsolute } from "@web-builder/styles";

export interface IWidgetWithStyle {
  styleData(): ElementCssStyleData;
}

/**
 * Since html based framework's widget can be represented withou any style definition, this WidgetWithStyle class indicates, that the sub instance of this class will contain style data within it.
 */
export abstract class WidgetWithStyle<OUTSTYLE = ElementCssStyleData>
  extends JsxWidget
  implements
    IWHStyleWidget,
    IPositionedWidget,
    IBoxShadowWidget,
    IEdgeInsetsWidget
{
  width?: DimensionLength;
  height?: DimensionLength;
  minWidth?: DimensionLength;
  minHeight?: DimensionLength;
  maxWidth?: DimensionLength;
  maxHeight?: DimensionLength;

  constraint?: {
    left?: DimensionLength;
    top?: DimensionLength;
    right?: DimensionLength;
    bottom?: DimensionLength;
  };

  background?: Background;
  color?: Color;

  // IPositionWidget
  x?: number;
  y?: number;

  // IBoxShadowWidget
  boxShadow?: BoxShadowManifest[];

  // IEdgeInsetsWidget
  margin?: EdgeInsets;
  padding?: EdgeInsets;

  /**
   * if the style is null, it means don't make element as a styled component at all. if style is a empty object, it means to make a empty styled component.
   * @internal - use .style for accessing the full style data.
   */
  abstract styleData(): OUTSTYLE | null;
  get finalStyle() {
    return {
      ...this.styleData(),
      /**
       * FIXME: position shall not be specified when parent has a layout. (e.g. under flex)
       * aboce issue might be already resolved, but still the constraint property should be extracted as a hierarchy token item.
       */
      ...positionAbsolute(this.constraint),
      // --------------------------------------------------------------------
      // ALWAYS ON BOTTOM
      // extended to override
      ...this.extendedStyle,

      // --------------------------------------------------------------------
    };
  }

  abstract jsxConfig(): JSXElementConfig;

  private extendedStyle: ElementCssProperties = {};
  extendStyle<T = ElementCssProperties>(style: T) {
    this.extendedStyle = {
      ...this.extendedStyle,
      ...style,
    };
  }
}

/**
 * Since html based framework's widget can be represented withou any style definition, this WidgetWithStyle class indicates, that the sub instance of this class will contain style data within it.
 */
export abstract class MultiChildWidgetWithStyle
  extends WidgetWithStyle
  implements IWidgetWithStyle, IMultiChildJsxWidget
{
  readonly children: Array<JsxWidget> = [];

  constructor({ key }: { key: WidgetKey }) {
    super({ key: key });
  }
  abstract styleData(): ElementCssStyleData;

  abstract jsxConfig(): JSXElementConfig;
}
