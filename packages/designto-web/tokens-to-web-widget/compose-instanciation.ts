import { Composer } from ".";
import * as reusable from "@code-features/component/tokens";
import * as web from "@web-builder/core";
import { nameit, NameCases } from "coli";

export function compose_instanciation(
  widget: reusable.InstanceWidget,
  child_composer: Composer // not used
) {
  const masterkey = widget.meta.master.key;

  const identifier = nameit(widget.meta.master.key.originName, {
    case: NameCases.pascal,
  }).name;

  return new web.InstanciationElement({
    key: widget.key.copyWith({
      name: "ExampleUsageOf_" + identifier,
    }),
    identifier: identifier,
    arguments: widget.meta.arguments,
  });
}
