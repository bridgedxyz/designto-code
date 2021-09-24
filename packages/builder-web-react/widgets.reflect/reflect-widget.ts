import { WidgetTree } from "@web-builder/core/widget-tree/widget";
import { ImportDeclaration, Import, JSX, JSXElementLike } from "coli";
import { JSXElementConfig, WidgetKey } from "../../builder-web-core";
import { ColiObjectLike } from "@coli.codes/builder";

export abstract class ReflectReactWidget<T = any> extends WidgetTree {
  children?: WidgetTree[];
  readonly _type: string;
  readonly imports: string;
  readonly tag: string;

  constructor({ key }: { key: WidgetKey }) {
    super({ key });
  }

  buildImportDeclaration(): ImportDeclaration {
    return new Import().imports(this.imports).from("@reflect-ui/react").make();
  }

  abstract attributes(): ColiObjectLike<any>;

  jsxConfig(): JSXElementConfig {
    return {
      tag: JSX.identifier(this.tag),
      // attributes: this.attributes() as any,
    };
  }
}
