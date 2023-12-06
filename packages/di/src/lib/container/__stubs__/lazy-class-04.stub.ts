import { Inject } from '../../decorators/inject.decorator';
import { Injectable } from '../../decorators/injectable.decorator';
import { LazyInject } from '../../decorators/lazy-inject.decorator';
import { Optional } from '../../decorators/optional.decorator';
import { LazyClass03Stub } from './lazy-class-03.stub';

@Injectable()
export class LazyClass04Stub {
  public constructor(
    @LazyInject(() => LazyClass03Stub) @Optional() public readonly l3: LazyClass03Stub,
    @Inject('Host') public readonly host: string,
  ) {}
}
