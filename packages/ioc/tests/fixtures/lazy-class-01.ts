import { Injectable, LazyInject } from '../../lib/decorators'
import { LazyClass02 } from './lazy-class-02'

@Injectable()
export class LazyClass01 {
  public constructor(
    @LazyInject(() => LazyClass02) public readonly l2: LazyClass02,
    @LazyInject(() => 'Host') public readonly host: string
  ) {}
}
