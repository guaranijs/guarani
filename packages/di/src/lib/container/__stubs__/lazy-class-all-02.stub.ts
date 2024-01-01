import { Inject } from '../../decorators/inject.decorator';
import { Injectable } from '../../decorators/injectable.decorator';
import { LazyInject } from '../../decorators/lazy-inject.decorator';
import { LazyClassAllStub } from './lazy-class-all.stub';
import { LazyInterfaceAll } from './lazy-interface-all';

@Injectable()
export class LazyClassAll02Stub implements LazyInterfaceAll {
  public readonly name: string = 'lazy_class_all_02';

  public constructor(
    @LazyInject(() => LazyClassAllStub) public readonly lcas: LazyClassAllStub,
    @Inject('Host') public readonly host: string,
  ) {}
}
