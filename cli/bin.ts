import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { defaultConfigByFramework } from "@grida/builder-config-preset";
import { init } from "./init";
import { add } from "./add";
import { code } from "./code";
import { Framework } from "@grida/builder-platform-types";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import { checkForUpdate } from "./update";
import { login, logout } from "./auth";

function loadenv(argv) {
  const { cwd } = argv;
  // Load .env file
  const dotenvpath = path.join(cwd, ".env");
  if (fs.existsSync(dotenvpath)) {
    dotenv.config({ path: dotenvpath });
    console.log("Loaded .env file");
  }
}

export default async function cli() {
  await checkForUpdate();

  yargs(hideBin(process.argv))
    .option("cwd", {
      type: "string",
      default: process.cwd(),
      requiresArg: false,
    })
    .option("dry-run", {
      type: "boolean",
      default: false,
      requiresArg: false,
    })
    .global(["cwd", "dry-run"])
    .command(
      "init",
      "init grida project",
      () => {},
      ({ cwd }) => {
        init(cwd);
      }
    )
    .command(
      "add [uri]",
      "add grida module",
      () => {},
      async ({ cwd, uri }) => {
        add(cwd, { uri: uri as string, version: "latest" });
      },
      [loadenv]
    )
    .command(
      "login",
      "login to grida services",
      () => {},
      async () => {
        login();
      },
      [loadenv]
    )
    .command(
      "logout",
      "logout to grida services",
      () => {},
      async () => {
        logout();
      },
      [loadenv]
    )
    .command(
      "code <framework> <uri>",
      "generate code from input uri",
      (argv) => {
        // return;
      },
      async ({ cwd, framework, uri, out, ...argv }) => {
        //
        const _personal_access_token = argv[
          "figma-personal-access-token"
        ] as string;

        // make this path absolute if relative path is given.
        const _outpath_abs: string = path.isAbsolute(out as string)
          ? (out as string)
          : path.resolve(cwd, out as string);

        const config_framework = defaultConfigByFramework(
          framework as Framework
        );
        if (!config_framework) {
          throw new Error(`Unknown framework:  "${framework}"`);
        }

        code(cwd, {
          framework: config_framework,
          uri: uri as string,
          auth: {
            personalAccessToken: _personal_access_token,
          },
          baseUrl: _outpath_abs,
        });
      },
      [loadenv]
    )
    .option("figma-personal-access-token", {
      description: "figma personal access token",
      alias: ["fpat", "figma-pat"],
      type: "string",
      default: process.env.FIGMA_PERSONAL_ACCESS_TOKEN,
      requiresArg: false,
    })
    .option("out", {
      alias: ["o", "output"],
      type: "string",
      default: ".",
      requiresArg: true,
    })
    .demandCommand(0)
    .parse();
}
