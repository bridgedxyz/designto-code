import type { EditorState } from "core/states";
import { DesignInput } from "@grida/builder-config/input";
import {
  find_node_by_id_under_inpage_nodes,
  find_node_by_id_under_entry,
} from "@design-sdk/core/utils";

export function getTargetContainer(state: EditorState) {
  const thisPageNodes = state.selectedPage
    ? state.design.pages.find((p) => p.id == state.selectedPage).children
    : null;

  const targetId =
    state?.selectedNodes?.length === 1 ? state.selectedNodes[0] : null;

  if (!targetId) {
    return { target: null, root: null };
  }

  const container_of_target =
    find_node_by_id_under_inpage_nodes(targetId, thisPageNodes) || null;

  const root = thisPageNodes
    ? container_of_target &&
      (container_of_target.origin === "COMPONENT"
        ? DesignInput.forMasterComponent({
            master: container_of_target,
            all: state.design.pages,
            components: state.design.components,
          })
        : DesignInput.fromDesignWithComponents({
            design: container_of_target,
            components: state.design.components,
          }))
    : state.design?.input;

  const target =
    find_node_by_id_under_entry(targetId, root?.entry) ?? root?.entry;
  return { root, target };
}
