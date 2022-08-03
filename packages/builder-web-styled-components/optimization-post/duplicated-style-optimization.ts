///
/// General duplicated style optimization.
/// this is based on static rule, based on the names of the layer and styles.
///

import type { ElementCssStyleData } from "@coli.codes/css";
import { is_matching_name, NameMatchStrategy } from "./name-matcher";

/// 1. based on final built style
/// 2. based on pre-build style comparison
/// - suggesting the merged style name

export interface MinimalCssStyleRepresenationForCssPostOptimization {
  id: string;
  name: string;
  style: ElementCssStyleData;
}

export type CompareFunc<T, Res = any, Opt = any> = (
  a: T,
  b: T,
  options?: Opt
) => false | [true, Res];

export function find_duplication_in<T, Opt = any>(
  a: T,
  others: Array<T>,
  matcher: CompareFunc<T, any, Opt>,
  options?: Opt
) {
  for (const b of others) {
    if (matcher(a, b, options)) {
      return b;
    }
  }
}

/**
 * returns boolean based on input's name and style data. if both matches, return true.
 *
 * !Optimization Sensitive! - this function is called for every style in the document.
 * @param a 1st element
 * @param b 2nd element
 * @param options
 * @returns
 */
export function is_duplicate_by_name_and_style(
  a: MinimalCssStyleRepresenationForCssPostOptimization,
  b: MinimalCssStyleRepresenationForCssPostOptimization,
  options: {
    name_match: NameMatchStrategy | NameMatchStrategy[];
  }
): false | [true, string] {
  // name should be the same
  const namematch = is_matching_name(a.name, b.name, options.name_match);
  if (!namematch) {
    return false;
  }

  // style should be the same
  // 1. quick check the style length to optimize the process (the probability of the style is 'same' is lower than 'not-name')
  // since the step 2, json-stringify can be expensive to run for all comparisons.
  if (Object.keys(a.style).length !== Object.keys(a.style).length) {
    return false;
  }

  // 2. if lengh is same, check the style content
  const stylematch = JSON.stringify(a.style) === JSON.stringify(b.style);
  if (stylematch) {
    return [true, namematch[1]];
  } else {
    return false;
  }
}

type MatchResult<T> = {
  id: string;
  result: false | T;
};

/**
 * @deprecated NOT READY, NOT USED
 */
export abstract class DuplicationChecker<T extends { id: string }> {
  readonly memory: Map<string, MatchResult<T>>;
  readonly proxies: Map<string, string> = new Map();

  constructor() {
    this.memory = new Map();
  }

  /**
   *
   * register a fresh and new match result to the memory. if you are mapping a record that is already recognized as a matching result, use @proxy instead.
   * @param a
   * @param result
   */
  register(a: T, result: MatchResult<T>) {
    let r = this.memory.get(a.id);
    if (!r) {
      this.memory.set(a.id, r);
    }
  }

  /**
   * proxy (link) the match result to existing matching result.
   */
  proxy(a: T, to: T) {
    this.proxies.set(a.id, to.id);
  }

  isProxied(a: T): MatchResult<T> | false {
    const proxied_id = this.proxies.get(a.id);
    if (proxied_id) {
      const proxied_results = this.memory.get(proxied_id)!;
      if (proxied_results) {
        return {
          id: proxied_id,
          result: proxied_results[0].result,
        };
      }
    }

    return false;
  }

  exists(a: T): MatchResult<T> | false {
    const results = this.memory.get(a.id);
    if (results) {
      return results;
      return false;
    }
  }

  abstract check(a: T, b: T): boolean;
}

// class StyleNameDuplicationChecker extends DuplicationChecker<MinimalCssStyleRepresenation> {
//   check(a: MinimalCssStyleRepresenation, b: MinimalCssStyleRepresenation) {
//     // use func is_diplicate_by_name_and_style
//     return is_duplicate_by_name_and_style(a, b, {
//       //
//     });
//     //
//   }
// }
