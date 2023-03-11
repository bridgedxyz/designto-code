import produce from "immer";
import type {
  Action,
  SelectNodeAction,
  SelectPageAction,
  CodingUpdateFileAction,
  CanvasModeSwitchAction,
  TranslateNodeAction,
  PreviewBuildingStateUpdateAction,
  PreviewSetAction,
  DevtoolsConsoleAction,
  DevtoolsConsoleClearAction,
  BackgroundTaskPushAction,
  BackgroundTaskPopAction,
  BackgroundTaskUpdateProgressAction,
  EditorModeSwitchAction,
  CanvasFocusNodeAction,
  DesignerModeSwitchActon,
  CodingInitialFilesSeedAction,
  CodingNewTemplateSessionAction,
  EnterIsolatedInspectionAction,
  ExitIsolatedInspectionAction,
} from "core/actions";
import { EditorState } from "core/states";
import { NextRouter, useRouter } from "next/router";
import { CanvasStateStore } from "@code-editor/canvas/stores";
import q from "@design-sdk/query";
import assert from "assert";
import { getPageNode } from "utils/get-target-node";
import { nanoid } from "nanoid";

const _editor_path_name = "/files/[key]/";

const _DEV_CLEAR_LOG = false;

const clearlog = (by: string) => {
  if (_DEV_CLEAR_LOG) {
    console.clear();
    console.log(`cleard console by ${by}`);
  }
};

export function editorReducer(state: EditorState, action: Action): EditorState {
  const router = useRouter();
  const filekey = state.design.key;

  switch (action.type) {
    case "mode": {
      const { mode } = <EditorModeSwitchAction>action;
      if (mode === "goback") {
        return produce(state, (draft) => {
          const target = state.mode.last;
          draft.mode = {
            value: target,
            last: state.mode.value,
            updated: new Date(),
          };

          if (target === "design") {
            // todo: this should be a last selection as well, not index 0.
            draft.selectedPage = state.pages.find(
              (p) => p.type === "figma-canvas"
            ).id;
          }
        });
      } else {
        return produce(state, (draft) => {
          draft.mode = {
            value: mode,
            last: state.mode.value,
            updated: new Date(),
          };

          switch (mode) {
            case "code": {
              break;
            }
            case "design": {
              // if previous mode was somehing else.
              if (state.mode.value !== "design") {
                // todo: this should be a last selection as well, not index 0.
                draft.selectedPage = state.pages.find(
                  (p) => p.type === "figma-canvas"
                ).id;
                break;
              }
            }
            case "run":
          }
        });
      }
    }

    case "designer-mode": {
      const { mode } = <DesignerModeSwitchActon>action;
      return produce(state, (draft) => {
        draft.mode = {
          value: "design",
          last: state.mode.value,
          updated: new Date(),
        };
        draft.designerMode = mode;
      });
    }

    case "select-node": {
      const { node } = <SelectNodeAction>action;

      clearlog("editorReducer#select-node");

      // update router
      update_route(router, {
        node: Array.isArray(node) ? node[0] : node ?? state.selectedPage,
      });

      return reducers["select-node"](state, action);
    }

    case "canvas/focus": {
      const { node } = <CanvasFocusNodeAction>action;

      update_route(router, { node });

      // 1. select node
      // 2. select page containing the node
      // 3. move canvas to the node (if page is canvas)

      return produce(state, (draft) => {
        const page = getPageNode(node, state);
        const _1_select_node = reducers["select-node"](draft, {
          node: node,
        });
        const _2_select_page = reducers["select-page"](_1_select_node, {
          page: page.id,
        });

        const final = _2_select_page;

        return <EditorState>{
          ...final,
          canvas: {
            // refresh canvas focus to the target.
            focus: {
              refreshkey: nanoid(4),
              nodes: [node],
            },
            // update selection
            selectedNodes: [node],
          },
        };
      });
    }

    case "design/enter-isolation": {
      const { node } = <EnterIsolatedInspectionAction>action;
      return produce(state, (draft) => {
        draft.isolation = {
          isolated: true,
          node: node,
        };

        // (todo: update router)
        draft.selectedNodes = [node];
      });
    }

    case "design/exit-isolation": {
      const {} = <ExitIsolatedInspectionAction>action;
      return produce(state, (draft) => {
        draft.isolation = {
          isolated: false,
          node: null,
        };
      });
    }

    case "select-page": {
      const { page } = <SelectPageAction>action;

      clearlog("editorReducer#select-page");

      switch (page) {
        case "home": {
          update_route(router, { node: undefined });
        }

        default: {
          // update router
          update_route(router, { node: page });
        }
      }

      return reducers["select-page"](state, action);
    }

    case "node-transform-translate": {
      const { translate, node } = <TranslateNodeAction>action;

      return produce(state, (draft) => {
        const page = draft.design.pages.find(
          (p) => p.id === state.selectedPage
        );

        node
          .map((n) => q.getNodeByIdFrom(n, page.children))
          .map((n) => {
            n.x += translate[0];
            n.y += translate[1];
          });
      });
    }

    case "coding/new-template-session": {
      const { template } = <CodingNewTemplateSessionAction>action;
      const { type, target } = template;

      return produce(state, (draft) => {
        switch (type) {
          case "d2c": {
            // init new page if required
            const code_default_drafts_page = "code-drafts";
            if (
              state.pages.some(
                (p) => p.type === "code" && p.id === code_default_drafts_page
              )
            ) {
              draft.selectedPage = code_default_drafts_page;
            } else {
              draft.pages.push({
                id: code_default_drafts_page,
                name: "Code",
                type: "code",
              });
              draft.selectedPage = code_default_drafts_page;
            }

            // reset files
            draft.code.files = {};
            draft.code.loading = true;
            draft.code.runner = {
              type: "scene",
              sceneId: target,
            };
            draft.mode = {
              value: "code",
              last: state.mode.value,
              updated: new Date(),
            };
          }
        }
      });
    }
    case "coding/initial-seed": {
      const { files, open, focus, entry } = <CodingInitialFilesSeedAction>(
        action
      );
      return produce(state, (draft) => {
        const keys = Object.keys(files);
        if (keys.length > 0) {
          draft.code.files = files;
          draft.code.loading = false;
          // const
          draft.code.runner = {
            ...state.code.runner,
            entry,
          };
          draft.selectedNodes = [focus] ?? [keys[0]];
        }
      });
    }
    case "codeing/update-file": {
      const { key, content } = <CodingUpdateFileAction>action;
      return produce(state, (draft) => {
        const file = state.code.files[key];
        draft.code.files[key] = {
          ...file,
          content,
        };
      });
    }

    case "canvas-mode": {
      const { mode } = <CanvasModeSwitchAction>action;

      update_route(router, { mode }, false); // shallow false

      if (mode === "goback") {
        const dest = state.canvasMode.last ?? state.canvasMode.value;

        assert(
          dest,
          "canvas-mode-goback: cannot resolve destination. (no fallback provided)"
        );

        return produce(state, (draft) => {
          draft.canvasMode = {
            value: dest,
            last: state.canvasMode.value,
            updated: new Date(),
          };
        });
      } else {
        return produce(state, (draft) => {
          draft.canvasMode = {
            value: mode,
            last: state.canvasMode.value,
            updated: new Date(),
          };
        });
      }
    }

    // todo move to other context
    case "preview-update-building-state": {
      const { isBuilding } = <PreviewBuildingStateUpdateAction>action;
      return produce(state, (draft) => {
        if (draft.currentPreview) {
          draft.currentPreview.isBuilding = isBuilding;
        } else {
          draft.currentPreview = {
            loader: null,
            viewtype: "unknown",
            isBuilding: true,
            widgetKey: null,
            componentName: null,
            fallbackSource: "loading",
            initialSize: null,
            meta: null,
            source: null,
            updatedAt: Date.now(),
          };
        }
      });
    }

    // todo move to other context
    case "preview-set": {
      const { data } = <PreviewSetAction>action;
      return produce(state, (draft) => {
        draft.currentPreview = data; // set
      });
    }

    // todo: move to workspace state
    case "devtools-console": {
      const { log } = <DevtoolsConsoleAction>action;
      return produce(state, (draft) => {
        if (!draft.devtoolsConsole?.logs?.length) {
          draft.devtoolsConsole = { logs: [] };
        }

        const logs = Array.from(state.devtoolsConsole?.logs ?? []);
        logs.push(log);

        draft.devtoolsConsole.logs = logs;
      });
      break;
    }

    // todo: move to workspace state
    case "devtools-console-clear": {
      const {} = <DevtoolsConsoleClearAction>action;
      return produce(state, (draft) => {
        if (draft.devtoolsConsole?.logs?.length) {
          draft.devtoolsConsole.logs = [
            {
              id: "clear",
              method: "info",
              data: ["Console was cleared"],
            },
          ];
        }
      });
      break;
    }

    default:
      throw new Error(`Unhandled action type: ${action["type"]}`);
  }

  return state;
}

function update_route(
  router: NextRouter,
  { node, mode }: { node?: string; mode?: string },
  shallow = true
) {
  const q = {
    node: node,
    mode: mode,
  };

  // remove undefined fields
  Object.keys(q).forEach((k) => q[k] === undefined && delete q[k]);

  router.push(
    {
      pathname: _editor_path_name,
      query: { ...router.query, ...q },
    },
    undefined,
    { shallow: shallow }
  );

  // router.push({
  //   pathname: _editor_path_name,
  //   query: { ...router.query, mode: dest },
  //   // no need to set shallow here.
  // });

  // router.push({
  //   pathname: _editor_path_name,
  //   query: { ...router.query, mode: mode },
  //   // no need to set shallow here.
  // });
}

const reducers = {
  "select-node": (
    state: EditorState,
    action: Omit<SelectNodeAction, "type">
  ) => {
    return produce(state, (draft) => {
      const filekey = state.design.key;

      const { node } = <SelectNodeAction>action;
      const ids = Array.isArray(node) ? node : [node];

      const current_node = state.selectedNodes;

      if (
        ids.length <= 1 &&
        current_node.length <= 1 &&
        ids[0] === current_node[0]
      ) {
        // same selection (no selection or same 1 selection)
        return produce(state, (draft) => {});
      }

      if (ids.length > 1 && ids.length === current_node.length) {
        // the selection event is always triggered by user, which means selecting same amount of nodes (greater thatn 1, and having a different node array is impossible.)
        return produce(state, (draft) => {});
      }

      const _canvas_state_store = new CanvasStateStore(
        filekey,
        state.selectedPage
      );

      const new_selections = ids.filter(Boolean);
      _canvas_state_store.saveLastSelection(...new_selections);

      // assign new nodes set to the state.
      draft.selectedNodes = new_selections;

      // remove the initial selection after the first interaction.
      draft.selectedNodesInitial = null;
    });
  },
  "select-page": (
    state: EditorState,
    action: Omit<SelectPageAction, "type">
  ) => {
    return produce(state, (draft) => {
      const { page: pageid } = <SelectPageAction>action;
      const page = state.pages.find((i) => i.id === pageid);

      assert(page, "page not found");

      const filekey = state.design.key;
      const _canvas_state_store = new CanvasStateStore(filekey, pageid);

      const last_known_selections_of_this_page =
        _canvas_state_store.getLastSelection() ?? [];
      draft.selectedPage = pageid;
      draft.selectedNodes = last_known_selections_of_this_page;

      // when page is seleced, force exit the isolation mode.
      draft.isolation = {
        isolated: false,
        node: null,
      };

      // update editor mode by page selection
      let nextmode = state.mode.value;
      switch (page.type) {
        case "code": {
          nextmode = "code";
          break;
        }
        case "home":
        case "figma-canvas": {
          nextmode = "design";
        }
      }
      draft.mode = {
        value: nextmode,
        last: state.mode.value,
        updated: new Date(),
      };
    });
  },
};
