import { Inject } from '../../../lib/decorators/inject';
import { Injectable } from '../../../lib/decorators/injectable';
import { LazyInject } from '../../../lib/decorators/lazy-inject';
import { LazyClass04Fixture } from './lazy-class-04.fixture';

@Injectable()
export class LazyClass03Fixture {
  public constructor(
    @LazyInject(() => LazyClass04Fixture, true) public readonly l4: LazyClass04Fixture,
    @Inject('Host') public readonly host: string
  ) {}
}
