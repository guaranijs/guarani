import 'reflect-metadata';

import { getContainer } from '@guarani/ioc';

getContainer('oauth2').bindToken<string[]>('Scopes').toValue<string[]>(['foo', 'bar', 'baz', 'qux']);
