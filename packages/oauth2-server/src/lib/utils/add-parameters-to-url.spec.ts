import { URL } from 'url';

import { Dictionary, Nullable, OneOrMany } from '@guarani/types';

import { addParametersToUrl } from './add-parameters-to-url';

describe('addParametersToUrl()', () => {
  it('should add the parameters to the query of the url.', () => {
    const url = new URL('https://client.example.com/oauth/callback');

    const parameters: Dictionary<Nullable<OneOrMany<string> | OneOrMany<number> | OneOrMany<boolean>>> = {
      var1: 'string',
      var2: 123,
      var3: true,
      var4: null,
      var5: undefined,
    };

    expect(addParametersToUrl(url, parameters).href).toEqual(
      'https://client.example.com/oauth/callback?var1=string&var2=123&var3=true',
    );
  });

  it('should add the parameters to the query of the url while preserving previous parameters.', () => {
    const url = new URL('https://client.example.com/oauth/callback?tenant=tenant');

    const parameters: Dictionary<Nullable<OneOrMany<string> | OneOrMany<number> | OneOrMany<boolean>>> = {
      var1: 'string',
      var2: 123,
      var3: true,
      var4: null,
      var5: undefined,
    };

    expect(addParametersToUrl(url, parameters).href).toEqual(
      'https://client.example.com/oauth/callback?tenant=tenant&var1=string&var2=123&var3=true',
    );
  });

  it('should add the parameters to the fragment of the url.', () => {
    const url = new URL('https://client.example.com/oauth/callback');

    const parameters: Dictionary<Nullable<OneOrMany<string> | OneOrMany<number> | OneOrMany<boolean>>> = {
      var1: 'string',
      var2: 123,
      var3: true,
      var4: null,
      var5: undefined,
    };

    expect(addParametersToUrl(url, parameters, 'hash').href).toEqual(
      'https://client.example.com/oauth/callback#var1=string&var2=123&var3=true',
    );
  });

  it('should add the parameters to the fragment of the url while preserving previous parameters.', () => {
    const url = new URL('https://client.example.com/oauth/callback#tenant=tenant');

    const parameters: Dictionary<Nullable<OneOrMany<string> | OneOrMany<number> | OneOrMany<boolean>>> = {
      var1: 'string',
      var2: 123,
      var3: true,
      var4: null,
      var5: undefined,
    };

    expect(addParametersToUrl(url, parameters, 'hash').href).toEqual(
      'https://client.example.com/oauth/callback#tenant=tenant&var1=string&var2=123&var3=true',
    );
  });
});
