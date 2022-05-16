import { Inject } from '../../../lib/decorators/inject';
import { Injectable } from '../../../lib/decorators/injectable';
import { LazyInject } from '../../../lib/decorators/lazy-inject';
import { LazyClass03Fixture } from './lazy-class-03.fixture';

@Injectable()
export class LazyClass04Fixture {
  public constructor(
    @LazyInject(() => LazyClass03Fixture, true) public readonly l3: LazyClass03Fixture,
    @Inject('Host') public readonly host: string
  ) {}
}
