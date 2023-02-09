import { Inject } from '../../decorators/inject.decorator';
import { Injectable } from '../../decorators/injectable.decorator';
import { LazyInject } from '../../decorators/lazy-inject.decorator';
import { LazyClass01Stub } from './lazy-class-01.stub';

@Injectable()
export class LazyClass02Stub {
  public constructor(
    @LazyInject(() => LazyClass01Stub) public readonly l1: LazyClass01Stub,
    @Inject('Host') public readonly host: string
  ) {}
}
