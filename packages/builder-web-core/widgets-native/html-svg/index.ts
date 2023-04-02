import { StylableJsxWidget } from "@web-builder/core/widget-tree/widget";
import { CSSProperties } from "@coli.codes/css";
import { StylableJSXElementConfig, WidgetKey } from "../..";
import * as css from "@web-builder/styles";
import {
  JSX,
  JSXAttribute,
  JSXClosingElement,
  JSXElement,
  JSXIdentifier,
  JSXOpeningElement,
  JSXSelfClosingElement,
  StringLiteral,
} from "coli";
import { Color, GradientType } from "@reflect-ui/core";
import { Background } from "@reflect-ui/core";
import { UnstylableJSXElementConfig } from "..";

/**
 * 
 * example output:
 * ```jsx
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10.59 2L6 6.58L1.41 2L0 3.41L6 9.41L12 3.41L10.59 2Z"
        fill="#CFCFCF"
      />
    </svg>
 * ```
 */
export class SvgElement extends StylableJsxWidget {
  _type = "svg";

  /**
   * a svg data string
   */
  readonly data: string;

  /**
   * svg path fill color
   */
  readonly fill?: Background;

  /**
   * svg path stroke color
   * @deprecated - this is currently not supported
   */
  readonly stroke?: Color;

  readonly children: StylableJsxWidget[];

  constructor(p: {
    key: WidgetKey;
    width?: number;
    height?: number;
    /**
     * svg data
     */
    data: string;
    fill?: Background;
    stroke?: Color;
  }) {
    super(p);

    // general
    this.width = p.width;
    this.height = p.height;

    // region svg related
    this.data = p.data;
    this.fill = p.fill;
    this.stroke = p.stroke;
    // endregion svg related

    this.children = this._init_children();
  }

  path({ fill }: { fill: string | false }) {
    return <StylableJsxWidget>{
      key: new WidgetKey({ id: `${this.key.id}.svg-path`, name: "svg-path" }),
      styleData: () => null,
      jsxConfig: () => {
        const _tag = JSX.identifier("path");
        return {
          tag: _tag,
          type: "tag-and-attr",
          attributes: [
            fill &&
              new JSXAttribute("fill", new StringLiteral(fill || "current")),
            new JSXAttribute("d", new StringLiteral(this.data ?? "")),
          ],
        };
      },
    };
  }

  private _init_children() {
    if (!this.fill) {
      return [this.path({ fill: "transparent" })];
    }

    if (Array.isArray(this.fill)) {
      console.error("multiple fills for svg path is not supported.");
    } else {
      switch (this.fill.type) {
        case "solid-color": {
          return [this.path({ fill: css.color(this.fill as Color) })];
        }
        case "graphics": {
          console.error("graphics fill for svg not supported.");
          return [this.path({ fill: "black" })];
        }
        case "gradient": {
          switch (this.fill._type) {
            case GradientType.LINEAR: {
              const fillid = "linear-gradient";

              const stop = (c: Color, stop: number) =>
                new JSXSelfClosingElement(new JSXIdentifier("stop"), {
                  attributes: [
                    new JSXAttribute("offset", new StringLiteral(`${stop}%`)),
                    new JSXAttribute(
                      "style",
                      new StringLiteral(`stop-color: ${css.color(c)}`)
                    ),
                  ],
                });

              const colors = this.fill.colors;
              const _svg_linear_gradient_stops = colors.map((c, i) => {
                return stop(c, (100 / (colors.length - 1)) * i);
              });

              const _def_id = new JSXIdentifier("defs");
              const _linear_id = new JSXIdentifier("linearGradient");
              const svg_gradient_style_def_block_snippet = new JSXElement({
                openingElement: new JSXOpeningElement(_def_id),
                children: [
                  new JSXElement({
                    openingElement: new JSXOpeningElement(_linear_id, {
                      attributes: [
                        new JSXAttribute("id", new StringLiteral(fillid)),
                      ],
                    }),
                    children: _svg_linear_gradient_stops,
                    closingElement: new JSXClosingElement(_linear_id),
                  }),
                ],
                closingElement: new JSXClosingElement(_def_id),
              });

              const fill = <StylableJsxWidget>{
                key: new WidgetKey({
                  id: `${this.key.id}.linear-gradient-fill`,
                  name: "linear-gradient-fill",
                }),
                styleData: () => null,
                jsxConfig: (): UnstylableJSXElementConfig => {
                  return {
                    type: "static-tree",
                    tree: svg_gradient_style_def_block_snippet,
                  };
                },
              };

              return [fill, this.path({ fill: `url(#${fillid})` })];
            }
            default: {
              console.error("unsupported gradient type for svg path.");
              return [this.path({ fill: "black" })];
            }
          }
        }
        default: {
          throw "not supported background";
        }
      }
    }
  }

  styleData(): CSSProperties {
    if (!this.data) {
      // svg data might be empty, in this case also w & h won't be available, we still should draw this element, but visually unreachable.
      // so we use 0, 0 for its size
      return {
        width: "0px",
        height: "0px",
      };
    }
    return {
      width: css.length(this.width),
      height: css.length(this.height),
      color: css.color(this.color),
    };
  }

  // @override
  get finalStyle() {
    const super_finalStyle = super.finalStyle;
    return {
      ...super_finalStyle,
      // TODO: this is a hot fix of svg & path's constraint handling
      // width & height for the svg must be preserved. (it wont' follow the constraints anyway.)
      // it can also be 100%
      width: css.length(this.width),
      height: css.length(this.height),
    };
  }

  jsxConfig(): StylableJSXElementConfig | UnstylableJSXElementConfig {
    return <StylableJSXElementConfig>{
      type: "tag-and-attr",
      tag: JSX.identifier("svg"),
      attributes: [
        new JSXAttribute(
          "xmlns",
          new StringLiteral("http://www.w3.org/2000/svg")
        ),
      ],
    };
  }
}
