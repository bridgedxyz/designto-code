# Installation & Build

```
git clone --recurse-submodules https://github.com/gridaco/designto-code
cd designto-code
yarn
yarn editor
```

## Structure

- editor - visual editor for development
- editor-packages - editor related packages
- packages - core packages contributing to the code-gen logic
- externals - external foundational packages, like [reflect-core](https://github.com/reflect-ui/reflect-core-ts)

## QnA

- Why 6626? - 6626 is from `69 68 2 67` Which is a decimal representation of ED2C(Engine: Design 2 Code)

## Utilities

- npx npkill to clean all node_modules folders
- clean: `npx npkill && rm -rf yarn.lock`