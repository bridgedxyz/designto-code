import type { FigmaFileKey } from "@design-sdk/figma-core";
import { WidgetKey } from "@reflect-ui/core";

export class FigmaWidgetKey extends WidgetKey {
  readonly filekey: FigmaFileKey;
  constructor({
    id,
    name,
    filekey,
  }: {
    id: string;
    name: string;
    filekey: FigmaFileKey;
  }) {
    super({ id, originName: name });
    this.filekey = filekey;
  }

  copyWith({
    id,
    name,
  }: {
    id?: string | undefined;
    name?: string | undefined;
  }): WidgetKey {
    return new FigmaWidgetKey({
      id: id ?? this.id,
      name: name ?? this.name,
      filekey: this.filekey,
    });
  }
}
