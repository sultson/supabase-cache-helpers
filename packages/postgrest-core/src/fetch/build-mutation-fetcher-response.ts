import { flatten } from 'flat';

import { get } from '../lib/get';
import { type NestedPath, isNestedPath } from '../lib/group-paths-recursive';
import type { Path } from '../lib/query-types';
import type { BuildNormalizedQueryReturn } from './build-normalized-query';

/**
 * The parsed response of the mutation fetcher
 **/
export type MutationFetcherResponse<R> = {
  /**
   * Normalized response. A flat json object with a depth of 1, where the keys are the full json paths.
   **/
  normalizedData: R;
  /**
   * Result of the query passed by the user
   **/
  userQueryData?: R;
};

export const buildMutationFetcherResponse = <R>(
  /**
   * response of the select query built by `buildNormalizedQuery`. contains dedupe aliases.
   **/
  input: R,
  {
    groupedPaths,
    groupedUserQueryPaths,
  }: Pick<BuildNormalizedQueryReturn, 'groupedPaths' | 'groupedUserQueryPaths'>,
): MutationFetcherResponse<R> => {
  return {
    normalizedData: normalizeResponse<R>(groupedPaths, input),
    userQueryData: groupedUserQueryPaths
      ? buildUserQueryData<R>(groupedUserQueryPaths, groupedPaths, input)
      : undefined,
  };
};

/**
 * Normalize the response by removing the dedupe alias and flattening it
 **/
export const normalizeResponse = <R>(
  groups: (Path | NestedPath)[],
  obj: R,
): R => {
  return groups.reduce<R>((prev, curr) => {
    // prefer alias over path because of dedupe alias
    const value = get(obj, curr.alias || curr.path);

    if (typeof value === 'undefined') return prev;
    if (value === null || !isNestedPath(curr)) {
      return {
        ...prev,
        [curr.path]: value,
      };
    }
    if (Array.isArray(value)) {
      return {
        ...prev,
        ...(flatten({
          [curr.path]: value.map((v) => normalizeResponse(curr.paths, v)),
        }) as R),
      };
    }
    return {
      ...prev,
      ...flatten({
        // add hint to path if it has dedupe alias
        // can happen if the same relation is queried multiple times via different fkeys
        [`${curr.path}${curr.alias?.startsWith('d_') && curr.declaration.split('!').length > 1 ? `!${curr.declaration.split('!')[1]}` : ''}`]:
          normalizeResponse(curr.paths, value as Record<string, unknown>),
      }),
    };
  }, {} as R);
};

/**
 * Build userQueryData from response
 *
 * note that `paths` is reflecting `obj`, not `userQueryPaths`.
 * iterate over `userQueryPaths` and find the corresponding path in `paths`.
 * Then, get value using the found alias and path from `obj`.
 **/
const buildUserQueryData = <R>(
  userQueryGroups: (Path | NestedPath)[],
  pathGroups: (Path | NestedPath)[],
  obj: R,
): R => {
  return userQueryGroups.reduce<R>((prev, curr) => {
    // paths is reflecting the obj
    const inputPath = pathGroups.find(
      (p) => p.path === curr.path && isNestedPath(p) === isNestedPath(curr),
    );
    if (!inputPath) {
      // should never happen though since userQueryPaths is a subset of paths
      throw new Error(`Path ${curr.path} not found in response paths`);
    }
    const value = get(obj, inputPath.alias || inputPath.path);

    if (typeof value === 'undefined') return prev;
    if (value === null || !isNestedPath(curr) || !isNestedPath(inputPath)) {
      (prev as Record<string, unknown>)[curr.alias ? curr.alias : curr.path] =
        value;
    } else if (Array.isArray(value)) {
      (prev as Record<string, unknown>)[curr.alias ? curr.alias : curr.path] =
        value.map((v) => buildUserQueryData(curr.paths, inputPath.paths, v));
    } else {
      (prev as Record<string, unknown>)[curr.alias ? curr.alias : curr.path] =
        buildUserQueryData(
          curr.paths,
          inputPath.paths,
          value as Record<string, unknown>,
        );
    }
    return prev;
  }, {} as R);
};
