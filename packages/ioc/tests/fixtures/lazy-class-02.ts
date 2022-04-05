import { Injectable } from '../../lib/decorators/injectable';
import { LazyInject } from '../../lib/decorators/lazy-inject';
import { LazyClass01 } from './lazy-class-01';

@Injectable()
export class LazyClass02 {
  public constructor(
    @LazyInject(() => LazyClass01) public readonly l1: LazyClass01,
    @LazyInject(() => 'Host') public readonly host: string,
  ) {}
}
