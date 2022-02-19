import { Injectable } from '../../lib/decorators/injectable';
import { LazyInject } from '../../lib/decorators/lazy-inject';
import { LazyClass02 } from './lazy-class-02';

@Injectable()
export class LazyClass01 {
  public constructor(
    @LazyInject(() => LazyClass02) public readonly l2: LazyClass02,
    @LazyInject(() => 'Host') public readonly host: string,
  ) {}
}
