import { Inject } from '../../decorators/inject.decorator';
import { Injectable } from '../../decorators/injectable.decorator';
import { LazyInject } from '../../decorators/lazy-inject.decorator';
import { LazyClass02Stub } from './lazy-class-02.stub';

@Injectable()
export class LazyClass01Stub {
  public constructor(
    @LazyInject(() => LazyClass02Stub) public readonly l2: LazyClass02Stub,
    @Inject('Host') public readonly host: string,
  ) {}
}
