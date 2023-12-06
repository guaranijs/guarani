import { stringify as stringifyQs } from 'querystring';
import { URL } from 'url';

import { removeNullishValues } from '@guarani/primitives';
import { Dictionary, Nullable, OneOrMany } from '@guarani/types';

/**
 * Populates the provided Url with the provided Parameters.
 *
 * @param url Url to be populated.
 * @param parameters Parameters used to populate the Url.
 * @param location Indicates if the parameters will be placed at the query or the fragment of the Url.
 * @returns Populated Url.
 */
export function addParametersToUrl(
  url: string | URL,
  parameters: Dictionary<Nullable<OneOrMany<string> | OneOrMany<number> | OneOrMany<boolean>>>,
  location: 'search' | 'hash' = 'search',
): URL {
  url = url instanceof URL ? url : new URL(url);
  url[location] += (url[location].length === 0 ? '' : '&') + stringifyQs(removeNullishValues(parameters));
  return url;
}
