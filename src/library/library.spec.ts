/// <reference path="../../node_modules/@types/jasmine/index.d.ts" />
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';

import {Schematic, Variable} from '../index';
import {Library} from './library';
import {IdentityCompiler} from '../api/compiler';
import {MemorySink, MemorySource, MemorySourceMap, MEMORY_SOURCE_MAP_TOKEN} from '../utils/memory';
import {Source} from '../api/source';
import {Sink} from '../api/sink';


class EmptySchematic extends Schematic {
  build() {
    return Observable.empty();
  }
}


describe('Library', () => {
  it('can register and create Schematics', () => {
    const library = new Library(new IdentityCompiler());

    library.register('empty', EmptySchematic);

    const s = library.create('empty');
    expect(s instanceof Schematic).toBe(true);
  });

  it('can perform the whole DI flow', (done) => {
    const library = new Library(new IdentityCompiler());
    const sink = new MemorySink();

    @Injectable()
    class SimpleSchematic extends Schematic {
      constructor(private _source: Source) {
        super();
      }
      build() {
        return this._source.read();
      }
    }

    library.addProviders([
      { provide: MEMORY_SOURCE_MAP_TOKEN, useValue: ({
        'file': 'hello world',
        'dir/file2': 'woot'
      }) },
      { provide: Source, useClass: MemorySource },
      { provide: Sink, useValue: sink }
    ]);

    library.register('empty', EmptySchematic);
    library.register('simple', SimpleSchematic);

    // Try to install the empty schematics.
    library.install('empty')
      .then(() => expect(sink.files).toEqual({}))
      .then(() => library.install('simple'))
      .then(() => {
        expect(sink.files).toEqual({
          'file': 'hello world',
          'dir/file2': 'woot'
        });
      })
      .then(done, done.fail);
  });
});