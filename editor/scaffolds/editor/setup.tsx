import React, { useEffect, useCallback, useState } from "react";
import { NextRouter } from "next/router";
import { EditorPage, EditorSnapshot, useEditorState } from "core/states";
import { useFigmaCommunityFile, useFigmaFile } from "hooks";
import { warmup } from "scaffolds/editor";
import type { FileResponse } from "@design-sdk/figma-remote-types";
import { useWorkspaceInitializerContext } from "scaffolds/workspace";
import { useDispatch } from "@code-editor/preferences";
import { FigmaImageServiceProvider } from "./editor-figma-image-service-provider";

const action_fetchfile_id = "fetchfile" as const;

type EditorSetupState = {
  /**
   * explicitly set loading to block uesr interaction.
   */
  loading?: boolean;
};

const EditorSetupContext = React.createContext<EditorSetupState>(null);

export function useEditorSetupContext() {
  return React.useContext(EditorSetupContext);
}

interface EssentialEditorSetupProps {
  nodeid: string;
  filekey: string;
  router: NextRouter;
}

function FigmaEditorBaseSetup({
  file,
  filekey,
  nodeid,
  router,
  children,
  loaded,
}: React.PropsWithChildren<
  EssentialEditorSetupProps & {
    file: FileResponse;
    loaded?: boolean;
  }
>) {
  const { provideEditorSnapshot: initialize } =
    useWorkspaceInitializerContext();

  // todo background file fetching to task queue
  // useEffect(() => {
  //   const task =
  //     // initial task
  //     {
  //       id: action_fetchfile_id,
  //       name: "Figma File",
  //       description: "Refreshing with latest figma file from remote",
  //       progress: null,
  //       createdAt: new Date(),
  //     };
  // }, [file]);

  const [state] = useEditorState();

  const initialCanvasMode = q_map_canvas_mode_from_query(
    router.query.mode as string
  ); // TODO: change this to reflect the nodeid input

  const initWith = useCallback(
    (file: FileResponse) => {
      let val: EditorSnapshot;

      // TODO: seed this as well
      // ->> file.styles;

      const components = warmup.componentsFrom(file);
      const pages = warmup.pagesFrom(filekey, file);

      if (state.design) {
        val = {
          ...state,
          design: {
            ...state.design,
            pages: pages,
          },
          selectedPage: warmup.selectedPage(state, pages, state.selectedNodes),
        };
      } else {
        const initialSelections =
          // set selected nodes initially only if the nodeid is the id of non-page node
          pages.some((p) => p.id === nodeid) ? [] : nodeid ? [nodeid] : [];

        val = {
          pages: [
            {
              id: "home",
              name: "Home",
              type: "home",
            } as EditorPage,
          ].concat(
            pages.map(
              (p) =>
                ({
                  id: p.id,
                  name: p.name,
                  type: "figma-canvas",
                } as EditorPage)
            )
          ),
          selectedNodes: initialSelections,
          selectedNodesInitial: initialSelections,
          selectedPage: warmup.selectedPage(state, pages, nodeid && [nodeid]),
          selectedLayersOnPreview: [],
          design: {
            name: file.name,
            version: file.version,
            lastModified: new Date(file.lastModified),
            input: null,
            components: components,
            // styles: null,
            key: filekey,
            pages: pages,
          },
          isolation: {
            isolated: false,
            node: null,
          },
          code: { files: {}, loading: true },
          canvasMode: initialCanvasMode,
        };
      }

      initialize(val);
    },
    [initialize, state]
  );

  useEffect(() => {
    if (file) {
      initWith(file);
    }
  }, [file]);

  return (
    <FigmaImageServiceProvider filekey={filekey}>
      <EditorSetupContext.Provider value={{ loading: !loaded }}>
        {children}
      </EditorSetupContext.Provider>
    </FigmaImageServiceProvider>
  );
}

export function SetupFigmaCommunityFileEditor({
  filekey,
  nodeid,
  router,
  children,
}: React.PropsWithChildren<EssentialEditorSetupProps>) {
  const fig = useFigmaCommunityFile({ id: filekey });
  const [file, setFile] = useState<FileResponse>(null);
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    switch (fig.__type) {
      case "error": {
        // TODO: set error here
        break;
      }
      case "loading": {
        // Do nothing. the community file won't be having loading state though.
        break;
      }
      case "file-fetched-for-app": {
        // ready.
        setLoaded(true);
        setFile(fig);
        break;
      }
    }
  }, [fig]);

  return (
    <FigmaEditorBaseSetup
      filekey={filekey}
      nodeid={nodeid}
      router={router}
      file={file}
      loaded={loaded}
    >
      {children}
    </FigmaEditorBaseSetup>
  );
}

export function SetupFigmaFileEditor({
  filekey,
  nodeid,
  router,
  children,
}: React.PropsWithChildren<EssentialEditorSetupProps>) {
  const [file, setFile] = useState<FileResponse>(null);
  const [loaded, setLoaded] = useState<boolean>(false);

  // background whole file fetching
  const fig = useFigmaFile({ file: filekey });

  const prefDispatch = useDispatch();

  const openFpatConfigurationPreference = useCallback(() => {
    prefDispatch({
      type: "open",
      route: "/figma/personal-access-token",
    });
  }, [prefDispatch]);

  useEffect(() => {
    if (loaded) {
      return;
    }

    if (fig.__type === "loading") {
      return;
    }

    if (fig.__type === "error") {
      // handle error by reason
      switch (fig.reason) {
        case "unauthorized":
        case "no-auth": {
          if (fig.cached) {
            setFile(fig.cached);
            setLoaded(true);
            alert(
              "You will now see the cached version of this file. To view the latest version, setup your personall access token."
            );
            // TODO: show signin prompt
            openFpatConfigurationPreference();
          } else {
            openFpatConfigurationPreference();
          }
          break;
        }
        case "no-file": {
          // ignore. might still be fetching file from query param.
          break;
        }
      }
      return;
    }

    if (!fig.__initial) {
      // when full file is loaded, allow editor with user interaction.
      setLoaded(true);
    }

    setFile(fig);
  }, [
    filekey,
    fig,
    fig.__type == "file-fetched-for-app" ? fig.document?.children : null,
  ]);

  return (
    <FigmaEditorBaseSetup
      file={file}
      filekey={filekey}
      nodeid={nodeid}
      router={router}
      loaded={loaded}
    >
      {children}
    </FigmaEditorBaseSetup>
  );
}

/**
 * TODO: support single design fetching
  // if target node is provided from query, use it.
  const design = useDesign({
    type: "use-file-node-id",
    file: filekey,
    node: nodeid,
  });


  useEffect(() => {
    if (!loading) {
      // if already loaded, ignore target node change.
      return;
    }
    if (design) {
      if (initialState.type === "success") return;
      initialDispatcher({
        type: "set",
        value: warmup.initializeDesign(design),
      });
    }
  }, [design, router.query, loading]);

  // under main hook
  if (design) {
    const initialState = warmup.initializeDesign(design);
    val = {
      ...initialState,
      design: {
        ...initialState.design,
        pages: pages,
      },
      selectedPage: warmup.selectedPage(
        prevstate,
        pages,
        initialState.selectedNodes
      ),
    };
  } else {
    
  }
 */

/**
 * legacy
 * @deprecated - remove this, replace the url users with the new pattern
 * @returns
 */
const q_map_canvas_mode_from_query = (
  mode: string
): EditorSnapshot["canvasMode"] => {
  return { value: "free" };
};
