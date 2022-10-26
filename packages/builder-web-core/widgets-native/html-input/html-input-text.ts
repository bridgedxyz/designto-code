import { CSSProperties, ElementCssStyleData } from "@coli.codes/css";
import { StylableJSXElementConfig, WidgetKey } from "../..";
import * as css from "@web-builder/styles";
import { JSX, JSXAttribute, StringLiteral } from "coli";
import { Container, UnstylableJSXElementConfig } from "..";
import {
  Color,
  EdgeInsets,
  ITextFieldManifest,
  IWHStyleWidget,
  TextAlign,
  TextAlignVertical,
  TextFieldDecoration,
  TextStyle,
} from "@reflect-ui/core";
import { SystemMouseCursors } from "@reflect-ui/core";
import { TextInputType } from "@reflect-ui/core";

/**
 * A Html input element dedicated to text related inputs.
 */
export class HtmlInputText extends Container implements ITextFieldManifest {
  _type = "input/text";

  // the input element can not contain children

  decoration?: TextFieldDecoration;
  autocorrect?: boolean;
  autofocus?: boolean;
  autofillHints?: string[];
  cursorColor?: Color;
  cursorHeight?: number;
  cursorRadius?: number;
  cursorWidth?: number;
  disabled?: boolean;
  enableSuggestions?: boolean;
  keyboardAppearance?: "light" | "dark";
  keyboardType?: TextInputType;
  maxLines?: number;
  minLines?: number;
  mouseCursor?: SystemMouseCursors;
  obscureText?: boolean;
  obscuringCharacter?: string;
  readOnly?: boolean;
  restorationId?: string;
  scrollPadding?: EdgeInsets;
  showCursor?: boolean;
  style: TextStyle;
  textAlign?: TextAlign;
  textAlignVertical?: TextAlignVertical;
  initialValue?: string;

  constructor({
    key,

    decoration,
    autocorrect,
    autofocus,
    autofillHints,
    cursorColor,
    cursorHeight,
    cursorRadius,
    cursorWidth,
    disabled,
    enableSuggestions,
    keyboardAppearance,
    keyboardType,
    maxLines,
    minLines,
    mouseCursor,
    obscureText,
    obscuringCharacter,
    readOnly,
    restorationId,
    scrollPadding,
    showCursor,
    style,
    textAlign,
    textAlignVertical,
    initialValue,

    ...rest
  }: { key: WidgetKey } & ITextFieldManifest & IWHStyleWidget) {
    super({ key, ...rest });

    this.decoration = decoration;
    this.autocorrect = autocorrect;
    this.autofocus = autofocus;
    this.autofillHints = autofillHints;
    this.cursorColor = cursorColor;
    this.cursorHeight = cursorHeight;
    this.cursorRadius = cursorRadius;
    this.cursorWidth = cursorWidth;
    this.disabled = disabled;
    this.enableSuggestions = enableSuggestions;
    this.keyboardAppearance = keyboardAppearance;
    this.keyboardType = keyboardType;
    this.maxLines = maxLines;
    this.minLines = minLines;
    this.mouseCursor = mouseCursor;
    this.obscureText = obscureText;
    this.obscuringCharacter = obscuringCharacter;
    this.readOnly = readOnly;
    this.restorationId = restorationId;
    this.scrollPadding = scrollPadding;
    this.showCursor = showCursor;
    this.style = style;
    this.textAlign = textAlign;
    this.textAlignVertical = textAlignVertical;
    this.initialValue = initialValue;

    // overrides
    this.padding = this.decoration.contentPadding;
  }

  styleData(): ElementCssStyleData {
    const containerstyle = super.styleData();

    // TODO:
    // - support placeholder text color styling

    return {
      // general layouts, continer ---------------------
      ...containerstyle,
      // -------------------------------------------------

      // padding
      ...css.padding(this.decoration.contentPadding),
      "box-sizing": (this.padding && "border-box") || undefined,

      // border
      border:
        this.decoration.border.borderSide &&
        css.borderSide(this.decoration.border?.borderSide),
      ...(("borderRadius" in this.decoration.border &&
        css.borderRadius(this.decoration.border["borderRadius"])) ??
        {}),
      // background
      "background-color": this.decoration.filled
        ? css.color(this.decoration.fillColor)
        : undefined,

      // text styles --------------------------------------------
      color: css.color(this.style.color),
      // "text-overflow": this.overflow,
      "font-size": css.px(this.style.fontSize),
      "font-family": css.fontFamily(this.style.fontFamily),
      "font-weight": css.convertToCssFontWeight(this.style.fontWeight),
      // "word-spacing": this.style.wordSpacing,
      "letter-spacing": css.letterSpacing(this.style.letterSpacing),
      "line-height": css.length(this.style.lineHeight),
      "text-align": this.textAlign,
      "text-decoration": css.textDecoration(this.style.decoration),
      "text-shadow": css.textShadow(this.style.textShadow),
      "text-transform": css.textTransform(this.style.textTransform),
      // text styles --------------------------------------------

      ...(this.decoration?.placeholderStyle
        ? {
            "::placeholder": {
              // TODO: optmiize - assign only diffferent properties values
              // TODO: not all properties are assigned
              color: css.color(this.decoration.placeholderStyle.color),
              "font-size": css.px(this.style.fontSize),
              "font-family": css.fontFamily(this.style.fontFamily),
              "font-weight": css.convertToCssFontWeight(this.style.fontWeight),
            },
          }
        : {}),
    };
  }

  // @ts-ignore
  jsxConfig(): StylableJSXElementConfig | UnstylableJSXElementConfig {
    const attrs = [
      new JSXAttribute(
        "type",
        new StringLiteral(inputtype(this.keyboardType, this.obscureText))
      ),
      this.autofocus && new JSXAttribute("autofocus", new StringLiteral("on")),
      this.autofillHints?.length >= 1 &&
        new JSXAttribute(
          "autocomplete",
          new StringLiteral(this.autofillHints.join(" "))
        ),
      this.disabled && new JSXAttribute("disabled"),
      this.initialValue &&
        new JSXAttribute("value", new StringLiteral(this.initialValue)),
      this.decoration.placeholderText &&
        new JSXAttribute(
          "placeholder",
          new StringLiteral(this.decoration.placeholderText)
        ),
      this.readOnly && new JSXAttribute("readonly"),
    ].filter(Boolean);

    return <StylableJSXElementConfig>{
      type: "tag-and-attr",
      tag: JSX.identifier("input"),
      attributes: attrs,
    };
  }

  get finalStyle() {
    const superstyl = super.finalStyle;

    // width override. ------------------------------------------------------------------------------------------
    // input element's width needs to be specified if the position is absolute and the left & right is specified.
    let width = superstyl.width;
    if (
      width === undefined &&
      superstyl.position === "absolute" &&
      superstyl.left !== undefined &&
      superstyl.right !== undefined
    ) {
      width = "calc(100% - " + superstyl.left + " - " + superstyl.right + ")";
    }
    // ----------------------------------------------------------------------------------------------------------

    return {
      ...superstyl,
      width,
    };
  }
}

/**
 * Text input with additional state styles
 */
export class HtmlTextField extends HtmlInputText {}

const inputtype = (t: TextInputType, isPassword?: boolean) => {
  if (isPassword) {
    return "password";
  }

  switch (t) {
    case TextInputType.datetime:
      return "datetime-local";
    case TextInputType.emailAddress:
      return "email";
    case TextInputType.none:
      return;
    case TextInputType.number:
      return "number";
    case TextInputType.phone:
      return "tel";
    case TextInputType.url:
      return "url";
    case TextInputType.visiblePassword:
      return "password";
    // case TextInputType.search:
    //   return "search";
    case TextInputType.text:
    case TextInputType.name:
    case TextInputType.streetAddress:
    case TextInputType.multiline:
    default:
      return "text";
  }
};
