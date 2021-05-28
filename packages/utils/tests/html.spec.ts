import { HTML } from '../lib'

describe('HTML functionalities', () => {
  it('should sanitize HTML tags.', () => {
    const html = `<script>window.alert('Hacked!!')</script>`

    expect(HTML.sanitizeHTML(html)).toBe(
      `&lt;script&gt;window.alert(&#39;Hacked!!&#39;)&lt;&#x2F;script&gt;`
    )
  })
})
