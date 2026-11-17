import { app } from '../src/app'

/** Client HTTP minimal qui garde le cookie de session, comme un navigateur. */
export class Client {
  /** Cookies conservés par nom (session, appareil…), comme un navigateur. */
  jar = new Map<string, string>()
  get cookie() {
    return [...this.jar].map(([k, v]) => `${k}=${v}`).join('; ')
  }
  set cookie(v: string) {
    this.jar.clear()
    for (const part of v.split(';')) {
      const [k, ...rest] = part.trim().split('=')
      if (k) this.jar.set(k, rest.join('='))
    }
  }
  async req(method: string, path: string, body?: unknown) {
    const res = await app.request(path, {
      method,
      headers: { 'content-type': 'application/json', cookie: this.cookie, 'cf-connecting-ip': '10.0.0.1' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    for (const c of res.headers.getSetCookie()) {
      const [pair, ...attrs] = c.split(';')
      const [k, ...rest] = pair!.trim().split('=')
      const value = rest.join('=')
      if (!value || attrs.some((a) => /max-age=0/i.test(a.trim()))) this.jar.delete(k!)
      else this.jar.set(k!, value)
    }
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
