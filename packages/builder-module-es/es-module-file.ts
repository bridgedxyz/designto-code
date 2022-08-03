import {
  SyntaxKind,
  SourceFile,
  BlockStatement,
  FunctionDeclaration,
  ImportDeclaration,
  Declaration,
  MultilineCommentTrivia,
} from "coli";
import { EsComponentExportingCofnig } from "@grida/builder-config/module-es";
import {
  add_export_keyword_modifier_to_declaration,
  wrap_with_export_assignment_jsx_component_identifier,
} from "./es-component-exporting";
import type { WidgetDeclarationDocumentation } from "@code-features/documentation";

export class EsWidgetModuleFile extends SourceFile {
  constructor({ name, path }: { name: string; path: string }) {
    super({ name, path });
  }
}

export function makeEsWidgetModuleFile({
  name,
  path,
  imports,
  body,
  documentation,
  declarations = [],
  config,
}: {
  name: string;
  path: string;
  imports: ImportDeclaration[];
  body: BlockStatement;
  documentation?: WidgetDeclarationDocumentation;
  declarations?: Declaration[];
  config: {
    exporting: EsComponentExportingCofnig;
  };
}): EsWidgetModuleFile {
  const { exporting } = config;
  const file = new EsWidgetModuleFile({
    name: `${name}.tsx`,
    path: path,
  });
  file.imports(...imports);

  // console.log("exporting", exporting);
  switch (exporting.type) {
    case "export-default-anonymous-functional-component": {
      // exporting.declaration_syntax_choice;
      // exporting.export_declaration_syntax_choice;
      // exporting.exporting_position;

      const export_default_anaonymous_functional_component =
        new FunctionDeclaration(undefined, {
          body: body,
          modifiers: {
            default: SyntaxKind.DefaultKeyword,
            export: SyntaxKind.ExportKeyword,
          },
        });

      addWidgetDocumentIfPresent(
        export_default_anaonymous_functional_component,
        documentation
      );

      file.declare(export_default_anaonymous_functional_component);
      file.declare(...declarations);
      break;
    }
    case "export-named-functional-component": {
      // exporting.declaration_syntax_choice;
      // exporting.export_declaration_syntax_choice;

      const named_function_declaration = new FunctionDeclaration(name, {
        body: body,
      });

      addWidgetDocumentIfPresent(named_function_declaration, documentation);

      switch (exporting.exporting_position) {
        case "after-declaration":
          file.declare(named_function_declaration);
          file.export(
            wrap_with_export_assignment_jsx_component_identifier(
              named_function_declaration.id!
            )
          );
          file.declare(...declarations);
          break;
        case "end-of-file":
          file.declare(named_function_declaration);
          file.declare(...declarations);
          file.export(
            wrap_with_export_assignment_jsx_component_identifier(
              named_function_declaration.id!
            )
          );
          break;
        case "with-declaration":
          const _exported_named_function_declaration =
            add_export_keyword_modifier_to_declaration<FunctionDeclaration>(
              named_function_declaration
            );
          file.declare(_exported_named_function_declaration);
          file.declare(...declarations);
          break;
      }
      break;
    }
    case "export-named-class-component":
      break;
    case "export-anonymous-class-component":
      throw new Error("Class component not supported");
  }

  return file;
}

function addWidgetDocumentIfPresent(
  declaration: FunctionDeclaration,
  documentation?: WidgetDeclarationDocumentation
) {
  if (documentation) {
    declaration.withDocument(
      new MultilineCommentTrivia({ text: documentation })
    );
  }
}
