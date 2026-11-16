import { app } from '../src/app'

/** Client HTTP minimal qui garde le cookie de session, comme un navigateur. */
export class Client {
  cookie = ''
  async req(method: string, path: string, body?: unknown) {
    const res = await app.request(path, {
      method,
      headers: { 'content-type': 'application/json', cookie: this.cookie, 'cf-connecting-ip': '10.0.0.1' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const set = res.headers.get('set-cookie')
    if (set) this.cookie = set.split(';')[0]!
    const text = await res.text()
    let json: any = null
    try {
      json = text ? JSON.parse(text) : null
    } catch {
      json = text
    }
    return { status: res.status, body: json }
  }
  get = (p: string) => this.req('GET', p)
  post = (p: string, b?: unknown) => this.req('POST', p, b ?? {})
  put = (p: string, b: unknown) => this.req('PUT', p, b)
  patch = (p: string, b: unknown) => this.req('PATCH', p, b)
}
