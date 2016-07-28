import {Entry, StaticEntry, MoveEntry, ConcatEntry, MergeJsonEntry} from './entry';
import {BaseException} from './exception';

import {template} from 'lodash';
import * as path from 'path';
import {Observable} from 'rxjs/Observable';

import 'rxjs/add/operator/groupBy';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/reduce';


export type TransformFn = (input: Observable<Entry>) => Observable<Entry>;
export type Context = {[key: string]: any};


export class InvalidKeyException extends BaseException {}


export function LodashCompile(context: Context): TransformFn {
  return (input: Observable<Entry>) => {
    return input.map(entry => {
      return new StaticEntry(entry.path, entry.name, template(entry.content)(context));
    });
  };
}


export type PathRemapperOptions = {
  ignoreUnknownKeys?: boolean;
  tokenRegex?: RegExp;
};


export function PathRemapper(context: Context, options: PathRemapperOptions = {
  ignoreUnknownKeys: false,
  tokenRegex: /__(.*?)__/g
}): TransformFn {
  return (input: Observable<Entry>) => {
    function replace(s: string) {
      return s.replace(options.tokenRegex, (m, name) => {
        if (name in context) {
          return context[name];
        } else if (options.ignoreUnknownKeys) {
          throw new InvalidKeyException();
        } else {
          return '';
        }
      });
    }

    return input.map(entry => {
      return new MoveEntry(entry, replace(entry.path), replace(entry.name));
    });
  };
}


function MergeDuplicatesWith<T extends Entry>(factory: (a: Entry, b: Entry) => T): TransformFn {
  return (input: Observable<Entry>) => {
    return input
      .groupBy(entry => path.join(entry.path, entry.name))
      .mergeMap(obs => {
        return obs.reduce(function(acc: Entry | null, curr: Entry) {
          if (acc === null) {
            return curr;
          }
          return factory(acc, curr);
        }, null);
      });
  };
}


export function ConcatDuplicates(): TransformFn {
  return MergeDuplicatesWith((a, b) => new ConcatEntry(a, b));
}


export function MergeJsonDuplicates(indent = 2): TransformFn {
  return MergeDuplicatesWith((a, b) => new MergeJsonEntry(a, b, indent));
}
