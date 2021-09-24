import { handle } from "@coli.codes/builder";
import { ExportAssignment } from "@coli.codes/core/assignment/export-assignment";
import { stringfy } from "@coli.codes/export-string";
import { ScopedVariableNamer } from "@coli.codes/naming";
import { ReservedKeywordPlatformPresets } from "@coli.codes/naming/reserved";
import { JSXElementConfig, WidgetKeyId } from "../../../builder-web-core";
import {
  buildStyledComponentConfig,
  NoStyleJSXElementConfig,
  StyledComponentJSXElementConfig,
} from "@web-builder/styled";
import {
  BlockStatement,
  FunctionDeclaration,
  Import,
  ImportDeclaration,
  JSXClosingElement,
  JSXElement,
  JSXElementLike,
  JSXIdentifier,
  JSXOpeningElement,
  JSXText,
  Return,
  SourceFile,
  VariableDeclaration,
} from "coli";
import { react_imports } from "../../build-app/import-specifications";
import {
  MultiChildWidget,
  SingleChildWidget,
  TextChildWidget,
  WidgetTree,
} from "@web-builder/core";
import { ReactComponentExportResult } from "../export-result";

const IMPORT_DEFAULT_STYLED_FROM_EMOTION_STYLED = new Import()
  .importDefault("styled")
  .from("@emotion/styled")
  .make();

const imports = [
  react_imports.import_react_from_react,
  IMPORT_DEFAULT_STYLED_FROM_EMOTION_STYLED,
];

/**
 * styled components pattern with either emotion or styled-component
 * @todo - this is not fully implemented
 * @param component
 * @returns
 */
export function stringfyReactWidget_STYLED_COMPONENTS(
  component: WidgetTree
): ReactComponentExportResult {
  const componentName = component.key.name;
  const styledComponentNamer = new ScopedVariableNamer(
    component.key.id,
    ReservedKeywordPlatformPresets.react
  );
  // buildWidgetExportable(component);

  const styledConfigWidgetMap: StyledConfigWidgetMap = getWidgetStyledConfigMap(
    component,
    {
      namer: styledComponentNamer,
    }
  );

  function getStyledConfigById(
    id: string
  ): StyledComponentJSXElementConfig | NoStyleJSXElementConfig {
    return styledConfigWidgetMap.get(id);
  }

  function buildComponentFunction(): FunctionDeclaration {
    function jsxBuilder(widget: WidgetTree) {
      const children = widget.children?.map((comp) => {
        const config = getStyledConfigById(comp.key.id);
        if (comp instanceof TextChildWidget) {
          return buildTextChildJsx(comp, config);
        }

        const childrenJSX = comp.children?.map((cc) => jsxBuilder(cc));
        return new JSXElement({
          openingElement: new JSXOpeningElement(config.tag, {
            attributes: config.attributes,
          }),
          closingElement: new JSXClosingElement(config.tag),
          children: childrenJSX,
        });
      });

      const config = getStyledConfigById(widget.key.id);
      if (widget instanceof TextChildWidget) {
        return buildTextChildJsx(widget, config);
      }
      return new JSXElement({
        openingElement: new JSXOpeningElement(config.tag, {
          attributes: config.attributes,
        }),
        closingElement: new JSXClosingElement(config.tag),
        children: children,
      });
    }

    let jsxTree = jsxBuilder(component);
    const componentFunction = new FunctionDeclaration(componentName, {
      body: new BlockStatement(new Return(jsxTree)),
    });

    return componentFunction;
  }

  const componentFunction = buildComponentFunction();

  const styledComponentDeclarations = Array.from(styledConfigWidgetMap.keys())
    .map((k) => {
      return (styledConfigWidgetMap.get(k) as StyledComponentJSXElementConfig)
        .styledComponent;
    })
    .filter((s) => s);

  const file = buildReactComponentFile({
    componentName: componentName,
    imports: imports,
    component: componentFunction,
    styleVariables: styledComponentDeclarations,
  });

  const final = stringfy(file.blocks, {
    language: "tsx",
    // formatter: {
    //   parser: "typescript",
    //   use: "pritter",
    // },
  });

  return {
    code: final,
    name: componentFunction.id.name,
    dependencies: ["@emotion/styled", "react"],
  };
}

function buildReactComponentFile(p: {
  componentName: string;
  imports: Array<ImportDeclaration>;
  component: FunctionDeclaration;
  styleVariables: Array<VariableDeclaration>;
}): SourceFile {
  const { imports, componentName, component, styleVariables } = p;
  const file = new SourceFile({
    name: `${componentName}.tsx`,
    path: "src/components",
  });

  file.imports(...imports);
  file.declare(component);
  file.declare(...styleVariables);
  file.export(new ExportAssignment(component.id));

  return file;
}

type StyledConfigWidgetMap = Map<
  WidgetKeyId,
  StyledComponentJSXElementConfig | NoStyleJSXElementConfig
>;
function getWidgetStyledConfigMap(
  rootWidget: WidgetTree,
  preferences: {
    namer: ScopedVariableNamer;
  }
): StyledConfigWidgetMap {
  const styledConfigWidgetMap: StyledConfigWidgetMap = new Map();

  function mapper(widget: WidgetTree) {
    if (!widget) {
      throw `cannot map trough ${widget}`;
    }
    const isRoot = widget.key.id == rootWidget.key.id;
    const id = widget.key.id;
    const styledConfig = buildStyledComponentConfig(widget, {
      transformRootName: true,
      namer: preferences.namer,
      context: {
        root: isRoot,
      },
    });

    styledConfigWidgetMap.set(id, styledConfig);
    widget.children?.map((childwidget) => {
      mapper(childwidget);
    });
  }

  mapper(rootWidget);

  return styledConfigWidgetMap;
}

////
//// region jsx tree builder
////

export function buildWidgetExportable(widget: WidgetTree) {
  const _key = widget.key;
  const _id = _key.id;
  const _name = _key.name;
  const jsxconfg = widget.jsxConfig();
  let jsx;
  let style;

  if (widget instanceof MultiChildWidget) {
    const children = widget.children;
    jsx = buildJsx(widget);

    //
  } else if (widget instanceof SingleChildWidget) {
    const child = widget.child;
    jsx = buildJsx(widget);
    //
  } else if (widget instanceof TextChildWidget) {
    const text = widget.text;
    jsx = buildTextChildJsx(widget, jsxconfg);
    //
  }

  //   return new ReactComponentExportable({});
}

function handleWidget(widget: WidgetTree) {}

function buildTextChildJsx(
  textchildwidget: TextChildWidget,
  config: JSXElementConfig
) {
  const text = textchildwidget.text;
  const tag = handle<JSXIdentifier>(config.tag);

  const jsxtext = new JSXText(text);
  return new JSXElement({
    openingElement: new JSXOpeningElement(tag, {
      attributes: config.attributes,
    }),
    children: jsxtext,
    closingElement: new JSXClosingElement(tag),
  });
}

function buildContainingJsx(
  container: JSXElementConfig,
  children: Array<JSXElementLike>
): JSXElementLike {
  const tag = handle<JSXIdentifier>(container.tag);
  return new JSXElement({
    openingElement: new JSXOpeningElement(tag, {
      attributes: container.attributes,
    }),
    closingElement: new JSXClosingElement(tag),
    children: children,
  });
}

function buildJsx(widget: WidgetTree): JSXElementLike {
  const children = buildChildrenJsx(widget.children);
  const container = buildContainingJsx(widget.jsxConfig(), children);
  return container;
}

function buildChildrenJsx(children: Array<WidgetTree>): Array<JSXElementLike> {
  return children?.map((c) => {
    return buildJsx(c);
  });
}
