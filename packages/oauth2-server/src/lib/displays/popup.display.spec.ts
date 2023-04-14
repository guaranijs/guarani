import { DependencyInjectionContainer } from '@guarani/di';

import { HttpResponse } from '../http/http.response';
import { Display } from './display.type';
import { PopupDisplay } from './popup.display';

const body = `
<!DOCTYPE html>
<html>
  <head></head>
  <body onload="openWindow('https://example.com/?foo=foo&bar=bar&baz=baz');">
    <script type="text/javascript">
      function callback(redirectTo) {
        window.location.replace(redirectTo);
      }

      function openWindow(url) {
        const top = Math.floor((window.outerHeight - 640) / 2);
        const left = Math.floor((window.outerWidth - 360) / 2);

        window.open(url, '_blank', \`top=\${top},left=\${left},width=360,height=640\`);
      }
    </script>
  </body>
</html>
`;

describe('Page Display', () => {
  let container: DependencyInjectionContainer;
  let display: PopupDisplay;

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(PopupDisplay).toSelf().asSingleton();

    display = container.resolve(PopupDisplay);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('name', () => {
    it('should have "popup" as its value.', () => {
      expect(display.name).toEqual<Display>('popup');
    });
  });

  describe('createHttpResponse()', () => {
    it('should create a http response with a populated html body.', () => {
      expect(display.createHttpResponse('https://example.com', { foo: 'foo', bar: 'bar', baz: 'baz' })).toStrictEqual(
        new HttpResponse().html(body)
      );
    });
  });
});
