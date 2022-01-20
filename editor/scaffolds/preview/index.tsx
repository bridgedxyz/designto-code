import React, { useEffect, useState } from "react";
import styled from "@emotion/styled";
import { vanilla_presets } from "@grida/builder-config-preset";
import { designToCode, Result } from "@designto/code";
import { config } from "@designto/config";
import {
  ImageRepository,
  MainImageRepository,
} from "@design-sdk/core/assets-repository";
import type { ReflectSceneNode } from "@design-sdk/figma-node";
import { DesignInput } from "@designto/config/input";
import { VanillaRunner } from "components/app-runner/vanilla-app-runner";

export function Preview({
  target,
  root,
}: {
  root: DesignInput;
  target: ReflectSceneNode;
}) {
  const [preview, setPreview] = useState<Result>();

  const on_preview_result = (result: Result) => {
    //@ts-ignore
    // if (result.id == targetStateRef?.current?.id) {
    setPreview(result);
    // }
  };

  useEffect(() => {
    const __target = target; // root.entry;
    if (__target) {
      const _input = {
        id: __target.id,
        name: __target.name,
        entry: __target,
      };
      const build_config = {
        ...config.default_build_configuration,
        disable_components: true,
      };

      // ----- for preview -----
      designToCode({
        input: _input,
        build_config: build_config,
        framework: vanilla_presets.vanilla_default,
        asset_config: {
          skip_asset_replacement: false,
          asset_repository: MainImageRepository.instance,
          custom_asset_replacement: {
            type: "static",
            resource:
              "https://bridged-service-static.s3.us-west-1.amazonaws.com/placeholder-images/image-placeholder-bw-tile-100.png",
          },
        },
      })
        .then(on_preview_result)
        .catch(console.error);

      if (!MainImageRepository.instance.empty) {
        designToCode({
          input: root,
          build_config: build_config,
          framework: vanilla_presets.vanilla_default,
          asset_config: { asset_repository: MainImageRepository.instance },
        })
          .then(on_preview_result)
          .catch(console.error);
      } else {
        console.error("MainImageRepository is empty");
      }
    }
  }, [target?.id]);

  if (!preview) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 4,
          boxShadow: "0px 0px 48px #00000020",
        }}
      ></div>
    );
  }

  return (
    <VanillaRunner
      key={preview.scaffold.raw}
      style={{
        borderRadius: 4,
        boxShadow: "0px 0px 48px #00000020",
      }}
      source={preview.scaffold.raw}
      width="100%"
      height="100%"
      componentName={preview.name}
    />
  );
}
