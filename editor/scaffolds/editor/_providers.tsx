import React from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { EditorImageRepositoryProvider } from "./editor-image-repository-provider";
import { EditorPreviewDataProvider } from "./editor-preview-provider";
import { EditorCanvasPreviewProvider } from "scaffolds/preview-canvas/editor-canvas-preview-provider";
import { ToastProvider } from "./editor-toast-provider";

export function EditorDefaultProviders(props: { children: React.ReactNode }) {
  return (
    <ShortcutsProvider>
      <EditorImageRepositoryProvider>
        <EditorCanvasPreviewProvider>
          <EditorPreviewDataProvider>
            <ToastProvider>{props.children}</ToastProvider>
          </EditorPreviewDataProvider>
        </EditorCanvasPreviewProvider>
      </EditorImageRepositoryProvider>
    </ShortcutsProvider>
  );
}

function ShortcutsProvider(props: { children: React.ReactNode }) {
  const noop = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const _save = keymap("ctrl-cmd", "s");
  const _preferences = keymap("ctrl-cmd", ",");

  useHotkeys(_save.universal, noop);
  useHotkeys(_preferences.universal, noop);

  return <>{props.children}</>;
}

const keymap = (
  ...c: ("ctrl" | "cmd" | "ctrl-cmd" | "shift" | "a" | "p" | "s" | ",")[]
) => {
  const magic_replacer = (s: string, os: "win" | "mac") => {
    return replaceAll(s, "ctrl-cmd", os === "win" ? "ctrl" : "cmd");
  };

  const win = magic_replacer(c.join("+"), "win");
  const mac = magic_replacer(c.join("+"), "mac");
  const universal = [win, mac].join(", ");
  return { win, mac, universal };
};

function _escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}
function replaceAll(str, match, replacement) {
  return str.replace(new RegExp(_escapeRegExp(match), "g"), () => replacement);
}
