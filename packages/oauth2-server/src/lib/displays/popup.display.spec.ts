import { Buffer } from 'buffer';
import { OutgoingHttpHeaders } from 'http';

import { DependencyInjectionContainer } from '@guarani/di';
import { Dictionary } from '@guarani/types';

import { Logger } from '../logger/logger';
import { Display } from './display.type';
import { PopupDisplay } from './popup.display';

jest.mock('../logger/logger');

const body = `
<!DOCTYPE html>
<html>
  <head></head>
  <body onload="openWindow('https://example.com/?var1=string&var2=123&var3=true');">
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

  const loggerMock = jest.mocked(Logger.prototype);

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(Logger).toValue(loggerMock);
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
      const response = display.createHttpResponse('https://example.com', {
        var1: 'string',
        var2: 123,
        var3: true,
        var4: null,
        var5: undefined,
      });

      expect(response.statusCode).toEqual(200);
      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({});
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ 'Content-Type': 'text/html; charset=UTF-8' });
      expect(response.body).toEqual(Buffer.from(body.trim(), 'utf8'));
    });
  });
});
