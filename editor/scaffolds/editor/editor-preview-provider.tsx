import React, { useCallback, useEffect, useMemo } from "react";
import { useEditorState } from "core/states";
import { preview_presets } from "@grida/builder-config-preset";
import { designToCode, Result } from "@designto/code";
import { config } from "@grida/builder-config";
import { MainImageRepository } from "@design-sdk/asset-repository";
import bundler from "@code-editor/esbuild-services";
import assert from "assert";
import { useDispatch } from "core/dispatch";
import { useTargetContainer } from "hooks";
import { WidgetKey } from "@reflect-ui/core";
import { placeholderimg_transparent_100x100 } from "k";
import { supportsPreview } from "config";
import { stable as dartservices } from "dart-services";
import Client, { FlutterProject } from "@flutter-daemon/client";

const esbuild_base_html_code = `<div id="root"></div>`;

const flutter_bundler: "dart-services" | "flutter-daemon" = "flutter-daemon";

/**
 * This is a queue handler of d2c requests.
 * Since the d2c can share cache and is a async process, we need this middleware wrapper to handle it elegantly.
 * @returns
 */
export function EditorPreviewDataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // listen to changes
  // handle changes, dispatch with results

  const [state] = useEditorState();
  const dispatch = useDispatch();

  const { target, root } = useTargetContainer();

  const updateBuildingState = useCallback(
    (isBuilding: boolean) => {
      dispatch({
        type: "preview-update-building-state",
        isBuilding,
      });
    },
    [dispatch]
  );

  const onInitialVanillaPreviewResult = useCallback(
    (result: Result, isAssetUpdate?: boolean) => {
      dispatch({
        type: "preview-set",
        data: {
          loader: "vanilla-html",
          viewtype: "unknown",
          widgetKey: result.widget.key,
          componentName: result.name,
          fallbackSource: result.scaffold.raw,
          source: result.scaffold.raw,
          initialSize: {
            width: result.widget?.["width"],
            height: result.widget?.["height"],
          },
          isBuilding: false,
          meta: {
            bundler: "vanilla",
            framework: result.framework.framework,
            reason: isAssetUpdate ? "fill-assets" : "initial",
          },
          updatedAt: Date.now(),
        },
      });
    },
    [dispatch]
  );

  const onVanillaPreviewResult = useCallback(
    ({
      key,
      initialSize,
      raw,
      componentName,
    }: {
      key: WidgetKey;
      initialSize: { width: number; height: number };
      raw: string;
      componentName: string;
    }) => {
      dispatch({
        type: "preview-set",
        data: {
          loader: "vanilla-html",
          viewtype: "unknown",
          widgetKey: key,
          componentName: componentName,
          fallbackSource: raw,
          source: raw,
          initialSize: initialSize,
          isBuilding: false,
          meta: {
            bundler: "vanilla",
            framework: "vanilla",
            reason: "update",
          },
          updatedAt: Date.now(),
        },
      });
    },
    [dispatch]
  );

  const onEsbuildReactPreviewResult = useCallback(
    ({
      key,
      initialSize,
      bundledjs,
      componentName,
    }: {
      key: WidgetKey;
      initialSize: { width: number; height: number };
      bundledjs: string;
      componentName: string;
    }) => {
      dispatch({
        type: "preview-set",
        data: {
          loader: "vanilla-esbuild-template",
          viewtype: "unknown",
          widgetKey: key,
          componentName: componentName,
          fallbackSource: state.currentPreview?.fallbackSource,
          source: {
            html: esbuild_base_html_code,
            javascript: bundledjs,
          },
          initialSize: initialSize,
          isBuilding: false,
          meta: {
            bundler: "esbuild-wasm",
            framework: "react",
            reason: "update",
          },
          updatedAt: Date.now(),
        },
      });
      consoleLog({
        method: "info",
        data: ["compiled esbuild-react", key, componentName],
      });
    },
    [dispatch]
  );

  const onDartServicesFlutterBuildComplete = useCallback(
    ({
      key,
      js,
      initialSize,
      componentName,
    }: {
      key: WidgetKey;
      js: string;
      initialSize: { width: number; height: number };
      componentName: string;
    }) => {
      dispatch({
        type: "preview-set",
        data: {
          loader: "vanilla-flutter-template",
          viewtype: "unknown",
          widgetKey: key,
          componentName: componentName,
          fallbackSource: state.currentPreview?.fallbackSource,
          source: js,
          initialSize: initialSize,
          isBuilding: false,
          meta: {
            bundler: "dart-services",
            framework: "flutter",
            reason: "update",
          },
          updatedAt: Date.now(),
        },
      });
      consoleLog({
        method: "info",
        data: ["compiled flutter app", key, componentName],
      });
    },
    [dispatch]
  );

  const consoleLog = useCallback(
    (p: { method; data }) => {
      dispatch({
        type: "devtools-console",
        log: p,
      });
    },
    [dispatch]
  );

  const _is_mode_requires_preview_build =
    state.canvasMode === "fullscreen-preview" ||
    state.canvasMode === "isolated-view";

  useEffect(() => {
    if (!_is_mode_requires_preview_build) {
      return;
    }

    if (!MainImageRepository.isReady) {
      return;
    }

    if (!target) {
      return;
    }

    const _input = {
      id: target.id,
      name: target.name,
      entry: target,
    };

    const build_config = {
      ...config.default_build_configuration,
      disable_components: true,
    };

    designToCode({
      input: _input,
      build_config: build_config,
      framework: preview_presets.default,
      asset_config: {
        skip_asset_replacement: false,
        asset_repository: MainImageRepository.instance,
        custom_asset_replacement: {
          type: "static",
          resource: placeholderimg_transparent_100x100,
        },
      },
    })
      .then(onInitialVanillaPreviewResult)
      .catch(console.error);

    if (!MainImageRepository.instance.empty) {
      updateBuildingState(true);
      designToCode({
        input: root,
        build_config: build_config,
        framework: preview_presets.default,
        asset_config: { asset_repository: MainImageRepository.instance },
      })
        .then((r) => {
          onInitialVanillaPreviewResult(r, true);
        })
        .catch(console.error)
        .finally(() => {
          updateBuildingState(false);
        });
    }
  }, [_is_mode_requires_preview_build, target?.id]);

  //   // ------------------------
  //   // ------ for esbuild -----
  useEffect(() => {
    if (!state.editingModule) {
      return;
    }

    if (supportsPreview(state.editingModule.framework)) {
      const { raw, componentName } = state.editingModule;
      assert(componentName, "component name is required");
      assert(raw, "raw input code is required");
      updateBuildingState(true);

      const wkey = new WidgetKey({
        originName: target.name,
        id: target.id,
      });

      const initialSize = {
        width: target.width,
        height: target.height,
      };

      switch (state.editingModule.framework) {
        case "react": {
          bundler(transform(raw, componentName), "tsx")
            .then((d) => {
              if (d.err == null) {
                if (d.code) {
                  onEsbuildReactPreviewResult({
                    key: wkey,
                    initialSize: initialSize,
                    bundledjs: d.code,
                    componentName: componentName,
                  });
                }
              } else {
                consoleLog({ ...d.err });
              }
            })
            .catch((e) => {
              consoleLog({ method: "error", data: [e.message] });
            })
            .finally(() => {
              updateBuildingState(false);
            });
          break;
        }
        case "vanilla": {
          onVanillaPreviewResult({
            key: wkey,
            initialSize,
            componentName,
            raw: state.editingModule.raw,
          });
          break;
        }
        case "flutter": {
          is_daemon_running(local_flutter_daemon_server_url).then(
            (daemon_available) => {
              consoleLog({
                method: "info",
                data: ["running flutter app with local daemon"],
              });
              if (daemon_available) {
                FlutterDaemon.instance
                  .initProject(state.editingModule.raw)
                  .then(() => {
                    setTimeout(() => {
                      FlutterDaemon.instance
                        .save(state.editingModule.raw)
                        .then(() => {
                          FlutterDaemon.instance.webLaunchUrl().then((url) => {
                            updateBuildingState(false);
                            dispatch({
                              type: "preview-set",
                              data: {
                                loader: "flutter-daemon-view",
                                viewtype: "unknown",
                                widgetKey: wkey,
                                componentName: componentName,
                                fallbackSource:
                                  state.currentPreview?.fallbackSource,
                                source: url,
                                initialSize: initialSize,
                                isBuilding: false,
                                meta: {
                                  bundler: "flutter-daemon",
                                  framework: "flutter",
                                  reason: "update",
                                },
                                updatedAt: Date.now(),
                              },
                            });
                          });
                        });
                    }, 500);
                  });
              } else {
                dartservices
                  .compileComplete(state.editingModule.raw)
                  .then((r) => {
                    if (!r.error) {
                      onDartServicesFlutterBuildComplete({
                        key: wkey,
                        initialSize: initialSize,
                        componentName: componentName,
                        js: r.result,
                      });
                    } else {
                      consoleLog({ method: "error", data: [r.error] });
                    }
                  })
                  .catch((e) => {
                    consoleLog({ method: "error", data: [e.message] });
                  })
                  .finally(() => {
                    updateBuildingState(false);
                  });
              }
            }
          );
          break;
        }
        default:
          throw new Error(
            `Unsupported framework: ${state.editingModule.framework}`
          );
      }
    }
  }, [state.editingModule?.framework, state.editingModule?.raw]);

  return <>{children}</>;
}

// function esbuildit(state: EditorState) {

// }

const transform = (s, n) => {
  return `import React from 'react'; import ReactDOM from 'react-dom';
${s}
const App = () => <><${n}/></>
ReactDOM.render(<App />, document.querySelector('#root'));`;
};

function is_daemon_running(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    var ws = new WebSocket(url);
    ws.addEventListener("error", (e) => {
      // @ts-ignore
      if (e.target.readyState === 3) {
        resolve(false);
      }
    });
    ws.addEventListener("open", () => {
      resolve(true);
      ws.close();
    });
  });
}

const local_flutter_daemon_server_url = "ws://localhost:43070";

class FlutterDaemon {
  private static _instance: FlutterDaemon;
  static get instance() {
    if (!FlutterDaemon._instance) {
      FlutterDaemon._instance = new FlutterDaemon();
    }
    return FlutterDaemon._instance;
  }
  static client: Client;
  static project: FlutterProject;
  constructor() {
    if (!FlutterDaemon.client) {
      FlutterDaemon.client = new Client(local_flutter_daemon_server_url);
    }
  }

  async initProject(initial: string) {
    if (!FlutterDaemon.project) {
      FlutterDaemon.project = await FlutterDaemon.client.project(
        "preview",
        "preview",
        { "lib/main.dart": initial }
      );
    }
    return FlutterDaemon.project;
  }

  async save(content) {
    await FlutterDaemon.project.writeFile("lib/main.dart", content, true);
  }

  async webLaunchUrl() {
    return await FlutterDaemon.project.webLaunchUrl();
  }
}
