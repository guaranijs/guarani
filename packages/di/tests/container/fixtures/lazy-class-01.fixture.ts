import { Inject } from '../../../lib/decorators/inject';
import { Injectable } from '../../../lib/decorators/injectable';
import { LazyInject } from '../../../lib/decorators/lazy-inject';
import { LazyClass02Fixture } from './lazy-class-02.fixture';

@Injectable()
export class LazyClass01Fixture {
  public constructor(
    @LazyInject(() => LazyClass02Fixture) public readonly l2: LazyClass02Fixture,
    @Inject('Host') public readonly host: string
  ) {}
}
