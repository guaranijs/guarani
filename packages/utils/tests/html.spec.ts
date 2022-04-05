import { sanitizeHtml } from '../lib/html';

describe('sanitizeHtml()', () => {
  it('should sanitize HTML tags.', () => {
    const html = `<script>window.alert('Hacked!!')</script>`;

    expect(sanitizeHtml(html)).toBe(`&lt;script&gt;window.alert(&#39;Hacked!!&#39;)&lt;&#x2F;script&gt;`);
  });
});
