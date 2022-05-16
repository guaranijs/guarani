import { Inject } from '../../../lib/decorators/inject';
import { Injectable } from '../../../lib/decorators/injectable';
import { LazyInject } from '../../../lib/decorators/lazy-inject';
import { LazyClass01Fixture } from './lazy-class-01.fixture';

@Injectable()
export class LazyClass02Fixture {
  public constructor(
    @LazyInject(() => LazyClass01Fixture) public readonly l1: LazyClass01Fixture,
    @Inject('Host') public readonly host: string
  ) {}
}
