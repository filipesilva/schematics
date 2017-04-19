import { Observable } from 'rxjs/Observable';

import { BlueprintHost } from './host';


export type Action = CreateAction
  | RenameAction
  | UpdateAction
  | DeleteAction
  | FunctionAction;

export interface CreateAction {
  kind: 'c';
  path: string;
  isDirectory: boolean;
  content: string | null;
}

export interface RenameAction {
  kind: 'r';
  from: string;
  to: string;
}

export interface UpdateAction {
  kind: 'u';
  path: string;
  commit(content: string): Observable<string>;
}

export interface DeleteAction {
  kind: 'd';
  path: string;
}

export interface FunctionAction {
  kind: 'f';
  commit(host: BlueprintHost): Observable<Action>;
}