import {
  ScopedVariableNamer,
  ReservedKeywordPlatformPresets,
} from "@coli.codes/naming";
import { StyledComponentJSXElementConfig } from "@web-builder/styled";
import { solid_js_imports } from "@web-builder/solid-js";
import { JsxWidget } from "@web-builder/core";
import { BlockStatement, ImportDeclaration, Return } from "coli";
import {
  buildJsx,
  StylesConfigMapBuilder,
  StylesRepository,
} from "@web-builder/core/builders";
import { solid as solid_config } from "@designto/config";
import {
  StyledComponentDeclaration,
  create_duplication_reduction_map,
} from "@web-builder/styled";
import { solid_styled_components_imports } from "../solid-import-specifications";
import {
  EsWidgetModuleExportable,
  makeEsWidgetModuleFile,
} from "@web-builder/module-es";
import { Framework } from "@grida/builder-platform-types";
import { JsxComponentModuleBuilder } from "@web-builder/module-jsx";

export class SolidStyledComponentsBuilder extends JsxComponentModuleBuilder<solid_config.SolidStyledComponentsConfig> {
  constructor({
    entry,
    config,
  }: {
    entry: JsxWidget;
    config: solid_config.SolidStyledComponentsConfig;
  }) {
    super({
      entry,
      config,
      framework: Framework.solid,
      namer: new ScopedVariableNamer(
        entry.key.id,
        ReservedKeywordPlatformPresets.react
      ),
    });
  }

  protected initStylesConfigMapBuilder() {
    return new StylesConfigMapBuilder(
      this.entry,
      {
        namer: this.namer,
        rename_tag: true /** styled component tag shoule be renamed */,
      },
      Framework.solid
    );
  }

  protected initStylesRepository() {
    return new StylesRepository(
      this.stylesMapper.map,
      create_duplication_reduction_map
    );
  }

  protected jsxBuilder(widget: JsxWidget) {
    return buildJsx(
      widget,
      {
        styledConfig: (id) => this.stylesConfig(id),
      },
      {
        self_closing_if_possible: true,
      }
    );
  }

  protected partImports() {
    return [this.partImportSolidJS(), this.partImportStyled()];
  }

  protected partImportStyled() {
    switch (this.config.module) {
      case "solid-styled-components":
        return solid_styled_components_imports.import_styled;
    }
    throw (
      `Unexpected solidjs styled components module identifier: ` +
      this.config.module
    );
  }

  protected partImportSolidJS() {
    return solid_js_imports.render;
  }

  protected partBody(): BlockStatement {
    let jsxTree = this.jsxBuilder(this.entry);
    return new BlockStatement(new Return(jsxTree));
  }

  protected partDeclarations() {
    return Array.from(this.stylesRepository.uniques())
      .map((k) => {
        return (this.stylesRepository.get(k) as StyledComponentJSXElementConfig)
          .styledComponent;
      })
      .filter((s) => s);
  }

  public asExportableModule() {
    const body = this.partBody();
    const imports = this.partImports();
    const styled_declarations = this.partDeclarations();
    return new SolidStyledComponentWidgetModuleExportable(
      this.widgetName,
      {
        body,
        imports,
        declarations: styled_declarations,
      },
      {
        dependencies: ["solid-js", this.config.module],
      }
    );
  }
}

export class SolidStyledComponentWidgetModuleExportable extends EsWidgetModuleExportable {
  readonly declarations: StyledComponentDeclaration[];

  constructor(
    name,
    {
      body,
      imports,
      declarations,
    }: {
      body: BlockStatement;
      imports: ImportDeclaration[];
      declarations: StyledComponentDeclaration[];
    },
    {
      dependencies = [],
    }: {
      dependencies?: string[];
    }
  ) {
    super({
      name,
      body,
      imports,
    });

    this.declarations = declarations;
  }

  asFile({
    exporting,
  }: {
    exporting: solid_config.SolidComponentExportingCofnig;
  }) {
    return makeEsWidgetModuleFile({
      name: this.name,
      path: "src/components",
      imports: this.imports,
      declarations: this.declarations,
      body: this.body,
      config: {
        exporting: exporting,
      },
    });
  }
}
