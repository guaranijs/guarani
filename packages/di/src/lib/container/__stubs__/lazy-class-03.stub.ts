import { Inject } from '../../decorators/inject.decorator';
import { Injectable } from '../../decorators/injectable.decorator';
import { LazyInject } from '../../decorators/lazy-inject.decorator';
import { Optional } from '../../decorators/optional.decorator';
import { LazyClass04Stub } from './lazy-class-04.stub';

@Injectable()
export class LazyClass03Stub {
  public constructor(
    @Optional() @LazyInject(() => LazyClass04Stub) public readonly l4: LazyClass04Stub,
    @Inject('Host') public readonly host: string
  ) {}
}
