/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const lt = globalThis, wt = lt.ShadowRoot && (lt.ShadyCSS === void 0 || lt.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, kt = Symbol(), Tt = /* @__PURE__ */ new WeakMap();
let Lt = class {
  constructor(t, e, i) {
    if (this._$cssResult$ = !0, i !== kt) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = e;
  }
  get styleSheet() {
    let t = this.o;
    const e = this.t;
    if (wt && t === void 0) {
      const i = e !== void 0 && e.length === 1;
      i && (t = Tt.get(e)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), i && Tt.set(e, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const Zt = (s) => new Lt(typeof s == "string" ? s : s + "", void 0, kt), D = (s, ...t) => {
  const e = s.length === 1 ? s[0] : t.reduce((i, r, o) => i + ((a) => {
    if (a._$cssResult$ === !0) return a.cssText;
    if (typeof a == "number") return a;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + a + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(r) + s[o + 1], s[0]);
  return new Lt(e, s, kt);
}, te = (s, t) => {
  if (wt) s.adoptedStyleSheets = t.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
  else for (const e of t) {
    const i = document.createElement("style"), r = lt.litNonce;
    r !== void 0 && i.setAttribute("nonce", r), i.textContent = e.cssText, s.appendChild(i);
  }
}, Mt = wt ? (s) => s : (s) => s instanceof CSSStyleSheet ? ((t) => {
  let e = "";
  for (const i of t.cssRules) e += i.cssText;
  return Zt(e);
})(s) : s;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: ee, defineProperty: se, getOwnPropertyDescriptor: ie, getOwnPropertyNames: re, getOwnPropertySymbols: ae, getPrototypeOf: oe } = Object, O = globalThis, Nt = O.trustedTypes, ne = Nt ? Nt.emptyScript : "", $t = O.reactiveElementPolyfillSupport, X = (s, t) => s, ct = { toAttribute(s, t) {
  switch (t) {
    case Boolean:
      s = s ? ne : null;
      break;
    case Object:
    case Array:
      s = s == null ? s : JSON.stringify(s);
  }
  return s;
}, fromAttribute(s, t) {
  let e = s;
  switch (t) {
    case Boolean:
      e = s !== null;
      break;
    case Number:
      e = s === null ? null : Number(s);
      break;
    case Object:
    case Array:
      try {
        e = JSON.parse(s);
      } catch {
        e = null;
      }
  }
  return e;
} }, _t = (s, t) => !ee(s, t), Ut = { attribute: !0, type: String, converter: ct, reflect: !1, useDefault: !1, hasChanged: _t };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), O.litPropertyMetadata ?? (O.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let W = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ?? (this.l = [])).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, e = Ut) {
    if (e.state && (e.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((e = Object.create(e)).wrapped = !0), this.elementProperties.set(t, e), !e.noAccessor) {
      const i = Symbol(), r = this.getPropertyDescriptor(t, i, e);
      r !== void 0 && se(this.prototype, t, r);
    }
  }
  static getPropertyDescriptor(t, e, i) {
    const { get: r, set: o } = ie(this.prototype, t) ?? { get() {
      return this[e];
    }, set(a) {
      this[e] = a;
    } };
    return { get: r, set(a) {
      const l = r == null ? void 0 : r.call(this);
      o == null || o.call(this, a), this.requestUpdate(t, l, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? Ut;
  }
  static _$Ei() {
    if (this.hasOwnProperty(X("elementProperties"))) return;
    const t = oe(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(X("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(X("properties"))) {
      const e = this.properties, i = [...re(e), ...ae(e)];
      for (const r of i) this.createProperty(r, e[r]);
    }
    const t = this[Symbol.metadata];
    if (t !== null) {
      const e = litPropertyMetadata.get(t);
      if (e !== void 0) for (const [i, r] of e) this.elementProperties.set(i, r);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [e, i] of this.elementProperties) {
      const r = this._$Eu(e, i);
      r !== void 0 && this._$Eh.set(r, e);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(t) {
    const e = [];
    if (Array.isArray(t)) {
      const i = new Set(t.flat(1 / 0).reverse());
      for (const r of i) e.unshift(Mt(r));
    } else t !== void 0 && e.push(Mt(t));
    return e;
  }
  static _$Eu(t, e) {
    const i = e.attribute;
    return i === !1 ? void 0 : typeof i == "string" ? i : typeof t == "string" ? t.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    var t;
    this._$ES = new Promise((e) => this.enableUpdating = e), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), (t = this.constructor.l) == null || t.forEach((e) => e(this));
  }
  addController(t) {
    var e;
    (this._$EO ?? (this._$EO = /* @__PURE__ */ new Set())).add(t), this.renderRoot !== void 0 && this.isConnected && ((e = t.hostConnected) == null || e.call(t));
  }
  removeController(t) {
    var e;
    (e = this._$EO) == null || e.delete(t);
  }
  _$E_() {
    const t = /* @__PURE__ */ new Map(), e = this.constructor.elementProperties;
    for (const i of e.keys()) this.hasOwnProperty(i) && (t.set(i, this[i]), delete this[i]);
    t.size > 0 && (this._$Ep = t);
  }
  createRenderRoot() {
    const t = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return te(t, this.constructor.elementStyles), t;
  }
  connectedCallback() {
    var t;
    this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(!0), (t = this._$EO) == null || t.forEach((e) => {
      var i;
      return (i = e.hostConnected) == null ? void 0 : i.call(e);
    });
  }
  enableUpdating(t) {
  }
  disconnectedCallback() {
    var t;
    (t = this._$EO) == null || t.forEach((e) => {
      var i;
      return (i = e.hostDisconnected) == null ? void 0 : i.call(e);
    });
  }
  attributeChangedCallback(t, e, i) {
    this._$AK(t, i);
  }
  _$ET(t, e) {
    var o;
    const i = this.constructor.elementProperties.get(t), r = this.constructor._$Eu(t, i);
    if (r !== void 0 && i.reflect === !0) {
      const a = (((o = i.converter) == null ? void 0 : o.toAttribute) !== void 0 ? i.converter : ct).toAttribute(e, i.type);
      this._$Em = t, a == null ? this.removeAttribute(r) : this.setAttribute(r, a), this._$Em = null;
    }
  }
  _$AK(t, e) {
    var o, a;
    const i = this.constructor, r = i._$Eh.get(t);
    if (r !== void 0 && this._$Em !== r) {
      const l = i.getPropertyOptions(r), n = typeof l.converter == "function" ? { fromAttribute: l.converter } : ((o = l.converter) == null ? void 0 : o.fromAttribute) !== void 0 ? l.converter : ct;
      this._$Em = r;
      const h = n.fromAttribute(e, l.type);
      this[r] = h ?? ((a = this._$Ej) == null ? void 0 : a.get(r)) ?? h, this._$Em = null;
    }
  }
  requestUpdate(t, e, i, r = !1, o) {
    var a;
    if (t !== void 0) {
      const l = this.constructor;
      if (r === !1 && (o = this[t]), i ?? (i = l.getPropertyOptions(t)), !((i.hasChanged ?? _t)(o, e) || i.useDefault && i.reflect && o === ((a = this._$Ej) == null ? void 0 : a.get(t)) && !this.hasAttribute(l._$Eu(t, i)))) return;
      this.C(t, e, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, e, { useDefault: i, reflect: r, wrapped: o }, a) {
    i && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(t) && (this._$Ej.set(t, a ?? e ?? this[t]), o !== !0 || a !== void 0) || (this._$AL.has(t) || (this.hasUpdated || i || (e = void 0), this._$AL.set(t, e)), r === !0 && this._$Em !== t && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(t));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (e) {
      Promise.reject(e);
    }
    const t = this.scheduleUpdate();
    return t != null && await t, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    var i;
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this._$Ep) {
        for (const [o, a] of this._$Ep) this[o] = a;
        this._$Ep = void 0;
      }
      const r = this.constructor.elementProperties;
      if (r.size > 0) for (const [o, a] of r) {
        const { wrapped: l } = a, n = this[o];
        l !== !0 || this._$AL.has(o) || n === void 0 || this.C(o, void 0, a, n);
      }
    }
    let t = !1;
    const e = this._$AL;
    try {
      t = this.shouldUpdate(e), t ? (this.willUpdate(e), (i = this._$EO) == null || i.forEach((r) => {
        var o;
        return (o = r.hostUpdate) == null ? void 0 : o.call(r);
      }), this.update(e)) : this._$EM();
    } catch (r) {
      throw t = !1, this._$EM(), r;
    }
    t && this._$AE(e);
  }
  willUpdate(t) {
  }
  _$AE(t) {
    var e;
    (e = this._$EO) == null || e.forEach((i) => {
      var r;
      return (r = i.hostUpdated) == null ? void 0 : r.call(i);
    }), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(t)), this.updated(t);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(t) {
    return !0;
  }
  update(t) {
    this._$Eq && (this._$Eq = this._$Eq.forEach((e) => this._$ET(e, this[e]))), this._$EM();
  }
  updated(t) {
  }
  firstUpdated(t) {
  }
};
W.elementStyles = [], W.shadowRootOptions = { mode: "open" }, W[X("elementProperties")] = /* @__PURE__ */ new Map(), W[X("finalized")] = /* @__PURE__ */ new Map(), $t == null || $t({ ReactiveElement: W }), (O.reactiveElementVersions ?? (O.reactiveElementVersions = [])).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Z = globalThis, Ot = (s) => s, ht = Z.trustedTypes, zt = ht ? ht.createPolicy("lit-html", { createHTML: (s) => s }) : void 0, Bt = "$lit$", U = `lit$${Math.random().toFixed(9).slice(2)}$`, Qt = "?" + U, le = `<${Qt}>`, j = document, tt = () => j.createComment(""), et = (s) => s === null || typeof s != "object" && typeof s != "function", St = Array.isArray, ce = (s) => St(s) || typeof (s == null ? void 0 : s[Symbol.iterator]) == "function", yt = `[ 	
\f\r]`, G = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Dt = /-->/g, qt = />/g, q = RegExp(`>|${yt}(?:([^\\s"'>=/]+)(${yt}*=${yt}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), Ft = /'/g, Rt = /"/g, Vt = /^(?:script|style|textarea|title)$/i, he = (s) => (t, ...e) => ({ _$litType$: s, strings: t, values: e }), p = he(1), K = Symbol.for("lit-noChange"), y = Symbol.for("lit-nothing"), jt = /* @__PURE__ */ new WeakMap(), F = j.createTreeWalker(j, 129);
function Wt(s, t) {
  if (!St(s) || !s.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return zt !== void 0 ? zt.createHTML(t) : t;
}
const pe = (s, t) => {
  const e = s.length - 1, i = [];
  let r, o = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", a = G;
  for (let l = 0; l < e; l++) {
    const n = s[l];
    let h, g, c = -1, d = 0;
    for (; d < n.length && (a.lastIndex = d, g = a.exec(n), g !== null); ) d = a.lastIndex, a === G ? g[1] === "!--" ? a = Dt : g[1] !== void 0 ? a = qt : g[2] !== void 0 ? (Vt.test(g[2]) && (r = RegExp("</" + g[2], "g")), a = q) : g[3] !== void 0 && (a = q) : a === q ? g[0] === ">" ? (a = r ?? G, c = -1) : g[1] === void 0 ? c = -2 : (c = a.lastIndex - g[2].length, h = g[1], a = g[3] === void 0 ? q : g[3] === '"' ? Rt : Ft) : a === Rt || a === Ft ? a = q : a === Dt || a === qt ? a = G : (a = q, r = void 0);
    const u = a === q && s[l + 1].startsWith("/>") ? " " : "";
    o += a === G ? n + le : c >= 0 ? (i.push(h), n.slice(0, c) + Bt + n.slice(c) + U + u) : n + U + (c === -2 ? l : u);
  }
  return [Wt(s, o + (s[e] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), i];
};
class st {
  constructor({ strings: t, _$litType$: e }, i) {
    let r;
    this.parts = [];
    let o = 0, a = 0;
    const l = t.length - 1, n = this.parts, [h, g] = pe(t, e);
    if (this.el = st.createElement(h, i), F.currentNode = this.el.content, e === 2 || e === 3) {
      const c = this.el.content.firstChild;
      c.replaceWith(...c.childNodes);
    }
    for (; (r = F.nextNode()) !== null && n.length < l; ) {
      if (r.nodeType === 1) {
        if (r.hasAttributes()) for (const c of r.getAttributeNames()) if (c.endsWith(Bt)) {
          const d = g[a++], u = r.getAttribute(c).split(U), b = /([.?@])?(.*)/.exec(d);
          n.push({ type: 1, index: o, name: b[2], strings: u, ctor: b[1] === "." ? ue : b[1] === "?" ? fe : b[1] === "@" ? ge : dt }), r.removeAttribute(c);
        } else c.startsWith(U) && (n.push({ type: 6, index: o }), r.removeAttribute(c));
        if (Vt.test(r.tagName)) {
          const c = r.textContent.split(U), d = c.length - 1;
          if (d > 0) {
            r.textContent = ht ? ht.emptyScript : "";
            for (let u = 0; u < d; u++) r.append(c[u], tt()), F.nextNode(), n.push({ type: 2, index: ++o });
            r.append(c[d], tt());
          }
        }
      } else if (r.nodeType === 8) if (r.data === Qt) n.push({ type: 2, index: o });
      else {
        let c = -1;
        for (; (c = r.data.indexOf(U, c + 1)) !== -1; ) n.push({ type: 7, index: o }), c += U.length - 1;
      }
      o++;
    }
  }
  static createElement(t, e) {
    const i = j.createElement("template");
    return i.innerHTML = t, i;
  }
}
function J(s, t, e = s, i) {
  var a, l;
  if (t === K) return t;
  let r = i !== void 0 ? (a = e._$Co) == null ? void 0 : a[i] : e._$Cl;
  const o = et(t) ? void 0 : t._$litDirective$;
  return (r == null ? void 0 : r.constructor) !== o && ((l = r == null ? void 0 : r._$AO) == null || l.call(r, !1), o === void 0 ? r = void 0 : (r = new o(s), r._$AT(s, e, i)), i !== void 0 ? (e._$Co ?? (e._$Co = []))[i] = r : e._$Cl = r), r !== void 0 && (t = J(s, r._$AS(s, t.values), r, i)), t;
}
class de {
  constructor(t, e) {
    this._$AV = [], this._$AN = void 0, this._$AD = t, this._$AM = e;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t) {
    const { el: { content: e }, parts: i } = this._$AD, r = ((t == null ? void 0 : t.creationScope) ?? j).importNode(e, !0);
    F.currentNode = r;
    let o = F.nextNode(), a = 0, l = 0, n = i[0];
    for (; n !== void 0; ) {
      if (a === n.index) {
        let h;
        n.type === 2 ? h = new it(o, o.nextSibling, this, t) : n.type === 1 ? h = new n.ctor(o, n.name, n.strings, this, t) : n.type === 6 && (h = new me(o, this, t)), this._$AV.push(h), n = i[++l];
      }
      a !== (n == null ? void 0 : n.index) && (o = F.nextNode(), a++);
    }
    return F.currentNode = j, r;
  }
  p(t) {
    let e = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(t, i, e), e += i.strings.length - 2) : i._$AI(t[e])), e++;
  }
}
class it {
  get _$AU() {
    var t;
    return ((t = this._$AM) == null ? void 0 : t._$AU) ?? this._$Cv;
  }
  constructor(t, e, i, r) {
    this.type = 2, this._$AH = y, this._$AN = void 0, this._$AA = t, this._$AB = e, this._$AM = i, this.options = r, this._$Cv = (r == null ? void 0 : r.isConnected) ?? !0;
  }
  get parentNode() {
    let t = this._$AA.parentNode;
    const e = this._$AM;
    return e !== void 0 && (t == null ? void 0 : t.nodeType) === 11 && (t = e.parentNode), t;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t, e = this) {
    t = J(this, t, e), et(t) ? t === y || t == null || t === "" ? (this._$AH !== y && this._$AR(), this._$AH = y) : t !== this._$AH && t !== K && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : ce(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== y && et(this._$AH) ? this._$AA.nextSibling.data = t : this.T(j.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    var o;
    const { values: e, _$litType$: i } = t, r = typeof i == "number" ? this._$AC(t) : (i.el === void 0 && (i.el = st.createElement(Wt(i.h, i.h[0]), this.options)), i);
    if (((o = this._$AH) == null ? void 0 : o._$AD) === r) this._$AH.p(e);
    else {
      const a = new de(r, this), l = a.u(this.options);
      a.p(e), this.T(l), this._$AH = a;
    }
  }
  _$AC(t) {
    let e = jt.get(t.strings);
    return e === void 0 && jt.set(t.strings, e = new st(t)), e;
  }
  k(t) {
    St(this._$AH) || (this._$AH = [], this._$AR());
    const e = this._$AH;
    let i, r = 0;
    for (const o of t) r === e.length ? e.push(i = new it(this.O(tt()), this.O(tt()), this, this.options)) : i = e[r], i._$AI(o), r++;
    r < e.length && (this._$AR(i && i._$AB.nextSibling, r), e.length = r);
  }
  _$AR(t = this._$AA.nextSibling, e) {
    var i;
    for ((i = this._$AP) == null ? void 0 : i.call(this, !1, !0, e); t !== this._$AB; ) {
      const r = Ot(t).nextSibling;
      Ot(t).remove(), t = r;
    }
  }
  setConnected(t) {
    var e;
    this._$AM === void 0 && (this._$Cv = t, (e = this._$AP) == null || e.call(this, t));
  }
}
class dt {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, e, i, r, o) {
    this.type = 1, this._$AH = y, this._$AN = void 0, this.element = t, this.name = e, this._$AM = r, this.options = o, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = y;
  }
  _$AI(t, e = this, i, r) {
    const o = this.strings;
    let a = !1;
    if (o === void 0) t = J(this, t, e, 0), a = !et(t) || t !== this._$AH && t !== K, a && (this._$AH = t);
    else {
      const l = t;
      let n, h;
      for (t = o[0], n = 0; n < o.length - 1; n++) h = J(this, l[i + n], e, n), h === K && (h = this._$AH[n]), a || (a = !et(h) || h !== this._$AH[n]), h === y ? t = y : t !== y && (t += (h ?? "") + o[n + 1]), this._$AH[n] = h;
    }
    a && !r && this.j(t);
  }
  j(t) {
    t === y ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class ue extends dt {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === y ? void 0 : t;
  }
}
class fe extends dt {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== y);
  }
}
class ge extends dt {
  constructor(t, e, i, r, o) {
    super(t, e, i, r, o), this.type = 5;
  }
  _$AI(t, e = this) {
    if ((t = J(this, t, e, 0) ?? y) === K) return;
    const i = this._$AH, r = t === y && i !== y || t.capture !== i.capture || t.once !== i.once || t.passive !== i.passive, o = t !== y && (i === y || r);
    r && this.element.removeEventListener(this.name, this, i), o && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    var e;
    typeof this._$AH == "function" ? this._$AH.call(((e = this.options) == null ? void 0 : e.host) ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class me {
  constructor(t, e, i) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = e, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    J(this, t);
  }
}
const vt = Z.litHtmlPolyfillSupport;
vt == null || vt(st, it), (Z.litHtmlVersions ?? (Z.litHtmlVersions = [])).push("3.3.3");
const be = (s, t, e) => {
  const i = (e == null ? void 0 : e.renderBefore) ?? t;
  let r = i._$litPart$;
  if (r === void 0) {
    const o = (e == null ? void 0 : e.renderBefore) ?? null;
    i._$litPart$ = r = new it(t.insertBefore(tt(), o), o, void 0, e ?? {});
  }
  return r._$AI(s), r;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const R = globalThis;
class P extends W {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    var e;
    const t = super.createRenderRoot();
    return (e = this.renderOptions).renderBefore ?? (e.renderBefore = t.firstChild), t;
  }
  update(t) {
    const e = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = be(e, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    var t;
    super.connectedCallback(), (t = this._$Do) == null || t.setConnected(!0);
  }
  disconnectedCallback() {
    var t;
    super.disconnectedCallback(), (t = this._$Do) == null || t.setConnected(!1);
  }
  render() {
    return K;
  }
}
var It;
P._$litElement$ = !0, P.finalized = !0, (It = R.litElementHydrateSupport) == null || It.call(R, { LitElement: P });
const xt = R.litElementPolyfillSupport;
xt == null || xt({ LitElement: P });
(R.litElementVersions ?? (R.litElementVersions = [])).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const I = (s) => (t, e) => {
  e !== void 0 ? e.addInitializer(() => {
    customElements.define(s, t);
  }) : customElements.define(s, t);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const $e = { attribute: !0, type: String, converter: ct, reflect: !1, hasChanged: _t }, ye = (s = $e, t, e) => {
  const { kind: i, metadata: r } = e;
  let o = globalThis.litPropertyMetadata.get(r);
  if (o === void 0 && globalThis.litPropertyMetadata.set(r, o = /* @__PURE__ */ new Map()), i === "setter" && ((s = Object.create(s)).wrapped = !0), o.set(e.name, s), i === "accessor") {
    const { name: a } = e;
    return { set(l) {
      const n = t.get.call(this);
      t.set.call(this, l), this.requestUpdate(a, n, s, !0, l);
    }, init(l) {
      return l !== void 0 && this.C(a, void 0, s, l), l;
    } };
  }
  if (i === "setter") {
    const { name: a } = e;
    return function(l) {
      const n = this[a];
      t.call(this, l), this.requestUpdate(a, n, s, !0, l);
    };
  }
  throw Error("Unsupported decorator location: " + i);
};
function $(s) {
  return (t, e) => typeof e == "object" ? ye(s, t, e) : ((i, r, o) => {
    const a = r.hasOwnProperty(o);
    return r.constructor.createProperty(o, i), a ? Object.getOwnPropertyDescriptor(r, o) : void 0;
  })(s, t, e);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function m(s) {
  return $({ ...s, state: !0, attribute: !1 });
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ve = (s, t, e) => (e.configurable = !0, e.enumerable = !0, Reflect.decorate && typeof t != "object" && Object.defineProperty(s, t, e), e);
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function xe(s, t) {
  return (e, i, r) => {
    const o = (a) => {
      var l;
      return ((l = a.renderRoot) == null ? void 0 : l.querySelector(s)) ?? null;
    };
    return ve(e, i, { get() {
      return o(this);
    } });
  };
}
function we(s) {
  const e = String(s || "").replace(/\.[^.]+$/, "").split("-");
  if (e.length >= 4) {
    const i = Number(e[e.length - 1]);
    if (!Number.isNaN(i) && i >= 0 && i <= 1)
      return {
        filename: s,
        predicted: e[e.length - 2] || "unknown",
        score: i,
        eventId: e.length >= 5 ? `${e[0]}-${e[1]}` : null,
        ts: Number(e[0]) || 0
      };
  }
  return { filename: s, predicted: "unknown", score: null, eventId: null, ts: 0 };
}
function Kt(s) {
  return typeof s != "number" || Number.isNaN(s) ? "—" : `${Math.round(s > 1 ? s : s * 100)}%`;
}
function Jt(s) {
  if (typeof s != "number" || Number.isNaN(s)) return "none";
  const t = s > 1 ? s / 100 : s;
  return t >= 0.85 ? "high" : t >= 0.65 ? "mid" : "low";
}
function Yt(s) {
  return typeof s != "number" || Number.isNaN(s) ? "none" : s >= 75 ? "high" : s >= 50 ? "mid" : "low";
}
async function ke(s) {
  var Ct;
  const t = await createImageBitmap(s), e = t.width, i = t.height, r = Math.min(e, i), o = 64, a = document.createElement("canvas");
  a.width = o, a.height = o;
  const l = a.getContext("2d");
  l.drawImage(t, 0, 0, o, o), (Ct = t.close) == null || Ct.call(t);
  const n = l.getImageData(0, 0, o, o).data, h = new Float32Array(o * o);
  let g = 0;
  for (let f = 0; f < o * o; f++) {
    const Q = 0.299 * n[f * 4] + 0.587 * n[f * 4 + 1] + 0.114 * n[f * 4 + 2];
    h[f] = Q, g += Q;
  }
  const c = g / (o * o);
  let d = 0, u = 0, b = 0;
  for (let f = 1; f < o - 1; f++)
    for (let Q = 1; Q < o - 1; Q++) {
      const V = f * o + Q, Et = h[V] - c;
      d += Et * Et;
      const Xt = Math.abs(
        4 * h[V] - h[V - 1] - h[V + 1] - h[V - o] - h[V + o]
      );
      u += Xt, b++;
    }
  const S = Math.sqrt(d / Math.max(1, b)), E = u / Math.max(1, b), ot = Math.min(35, Math.max(0, (r - 32) / 96 * 35)), ut = Math.min(40, Math.max(0, E / 26 * 40)), B = c < 45 ? (45 - c) / 45 : c > 220 ? (c - 220) / 35 : 0, ft = Math.min(25, Math.max(0, S / 52 * 25)) * (1 - Math.min(0.8, B)), nt = Math.round(Math.min(100, Math.max(0, ot + ut + ft))), N = [];
  r < 60 && N.push(`${r}px`), E < 9 && N.push("Blurry"), c < 45 && N.push("Dark"), N.length || N.push(`${r}px`);
  const k = 16, gt = document.createElement("canvas");
  gt.width = k, gt.height = k;
  const Pt = gt.getContext("2d");
  Pt.drawImage(a, 0, 0, k, k);
  const mt = Pt.getImageData(0, 0, k, k).data, v = new Float32Array(k * k * 3);
  let bt = 0;
  for (let f = 0; f < k * k; f++)
    v[f * 3] = mt[f * 4], v[f * 3 + 1] = mt[f * 4 + 1], v[f * 3 + 2] = mt[f * 4 + 2], bt += v[f * 3] + v[f * 3 + 1] + v[f * 3 + 2];
  bt /= v.length;
  let At = 0;
  for (let f = 0; f < v.length; f++)
    v[f] -= bt, At += v[f] * v[f];
  const Gt = Math.sqrt(At) || 1;
  for (let f = 0; f < v.length; f++) v[f] /= Gt;
  return { score: nt, width: e, height: i, tag: N.join(" · "), desc: v };
}
function Ht(s, t) {
  if (!s || !t || s.length !== t.length) return 0;
  let e = 0;
  for (let i = 0; i < s.length; i++) e += s[i] * t[i];
  return e;
}
function _e(s, t) {
  var a, l, n, h, g, c;
  const e = Math.max(1, Math.min(s.length, t)), i = [...s].sort((d, u) => {
    var b, S;
    return (((b = u.quality) == null ? void 0 : b.score) ?? 50) - (((S = d.quality) == null ? void 0 : S.score) ?? 50);
  }), r = [], o = /* @__PURE__ */ new Map();
  if (i.length) {
    const d = i.shift();
    r.push(d), o.set(d.filename, "Top Quality");
  }
  for (; r.length < e && i.length; ) {
    let d = 0, u = -1 / 0, b = 0;
    for (let E = 0; E < i.length; E++) {
      const ot = i[E], ut = (((a = ot.quality) == null ? void 0 : a.score) ?? 50) / 100;
      let B = 0;
      for (const N of r) {
        const k = Ht((l = ot.quality) == null ? void 0 : l.desc, (n = N.quality) == null ? void 0 : n.desc);
        k > B && (B = k);
      }
      const ft = Math.max(0, B - 0.55) * 1.45, nt = ut * (1 - Math.min(0.85, ft));
      nt > u && (u = nt, d = E, b = B);
    }
    const S = i.splice(d, 1)[0];
    r.push(S), o.set(S.filename, b < 0.78 ? "Diverse" : "Good");
  }
  for (const d of i) {
    let u = 0;
    for (const S of r) {
      const E = Ht((h = d.quality) == null ? void 0 : h.desc, (g = S.quality) == null ? void 0 : g.desc);
      E > u && (u = E);
    }
    const b = ((c = d.quality) == null ? void 0 : c.score) ?? 50;
    o.set(d.filename, u >= 0.85 ? "Near-Dup" : b < 55 ? "Weak" : "Extra");
  }
  return { keepSet: new Set(r.map((d) => d.filename)), reasons: o };
}
class Se {
  constructor(t, e = "default") {
    this.hass = t, this.entryId = e, this.imgCache = /* @__PURE__ */ new Map(), this.qualityCache = /* @__PURE__ */ new Map();
  }
  get proxyBase() {
    return `/api/frigate_face_swipes/proxy/${encodeURIComponent(this.entryId || "default")}`;
  }
  async requestJson(t, e = {}) {
    const i = await this.hass.fetchWithAuth(`${this.proxyBase}/${t.replace(/^\/+/, "")}`, {
      ...e,
      headers: {
        "Content-Type": "application/json",
        ...e.headers || {}
      }
    }), r = await i.text();
    let o = null;
    try {
      o = r ? JSON.parse(r) : null;
    } catch {
      o = r;
    }
    if (!i.ok) {
      const a = o;
      throw new Error((a == null ? void 0 : a.error) || (a == null ? void 0 : a.message) || (a == null ? void 0 : a.detail) || r || `HTTP ${i.status}`);
    }
    return o;
  }
  getFaces() {
    return this.requestJson("api/faces");
  }
  classifyTrainFile(t, e) {
    return this.requestJson(`api/faces/train/${encodeURIComponent(t)}/classify`, {
      method: "POST",
      body: JSON.stringify({ training_file: e })
    });
  }
  deleteFaces(t, e) {
    return this.requestJson(`api/faces/${encodeURIComponent(t)}/delete`, {
      method: "POST",
      body: JSON.stringify({ ids: e })
    });
  }
  reclassifyFace(t, e, i) {
    return this.requestJson(`api/faces/${encodeURIComponent(t)}/reclassify`, {
      method: "POST",
      body: JSON.stringify({ id: e, new_name: i })
    });
  }
  getCachedUrl(t) {
    return this.imgCache.get(t) ?? null;
  }
  getCachedQuality(t) {
    return this.qualityCache.get(t) ?? null;
  }
  async fetchMedia(t) {
    if (!t) return null;
    const e = this.imgCache.get(t);
    if (e)
      return { url: e, quality: this.qualityCache.get(t) ?? null };
    try {
      const i = await this.hass.fetchWithAuth(`${this.proxyBase}/${t.replace(/^\/+/, "")}`);
      if (!i.ok) return null;
      const r = await i.blob(), o = URL.createObjectURL(r);
      this.imgCache.set(t, o);
      let a = null;
      return t.startsWith("clips/faces/") && (a = await ke(r).catch(() => null), a && this.qualityCache.set(t, a)), { url: o, quality: a };
    } catch {
      return null;
    }
  }
}
const rt = D`
  :host {
    display: block;
    font-family: inherit;
    color: var(--primary-text-color, #f3f4f6);
    --t-bg: var(--card-background-color, #14171c);
    --t-surface: var(--secondary-background-color, #1e232b);
    --t-border: var(--divider-color, rgba(255, 255, 255, 0.1));
    --t-muted: var(--secondary-text-color, #9ca3af);
  }
  button {
    touch-action: manipulation;
    font-family: inherit;
  }
  input[type='text'],
  select {
    background: var(--t-surface);
    color: var(--primary-text-color, #fff);
    border: 1px solid var(--t-border);
    border-radius: 8px;
    padding: 6px 9px;
    font-size: 12px;
    font-family: inherit;
  }
  .btn {
    background: var(--t-surface);
    color: var(--primary-text-color, #fff);
    border: 1px solid var(--t-border);
    border-radius: 8px;
    padding: 6px 11px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }
  .btn.primary {
    background: #2563eb;
    border-color: #2563eb;
    color: #fff;
  }
  .btn.green {
    background: #16a34a;
    border-color: #16a34a;
    color: #fff;
  }
  .btn.danger {
    background: rgba(239, 68, 68, 0.18);
    border-color: rgba(239, 68, 68, 0.45);
    color: #fca5a5;
  }
  .score-pill {
    font-size: 12px;
    font-weight: 700;
    padding: 3px 9px;
    border-radius: 999px;
    font-variant-numeric: tabular-nums;
  }
  .tier-high {
    background: rgba(34, 197, 94, 0.2);
    color: #4ade80;
  }
  .tier-mid {
    background: rgba(245, 158, 11, 0.2);
    color: #fbbf24;
  }
  .tier-low {
    background: rgba(239, 68, 68, 0.2);
    color: #f87171;
  }
  .tier-none {
    background: rgba(156, 163, 175, 0.2);
    color: var(--t-muted);
  }
  .q-badge {
    font-size: 11px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.72);
    color: #e5e7eb;
    font-variant-numeric: tabular-nums;
  }
  .q-badge.tier-high {
    background: rgba(22, 163, 74, 0.88);
    color: #fff;
  }
  .q-badge.tier-mid {
    background: rgba(217, 119, 6, 0.88);
    color: #fff;
  }
  .q-badge.tier-low {
    background: rgba(220, 38, 38, 0.88);
    color: #fff;
  }
  .tile-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
    gap: 8px;
  }
  .tile {
    position: relative;
    background: var(--t-bg);
    border: 2px solid transparent;
    border-radius: 10px;
    padding: 4px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .tile.selected {
    border-color: #3b82f6;
  }
  .tile.keep {
    border-color: #22c55e;
    background: rgba(34, 197, 94, 0.08);
  }
  .tile.prune {
    border-color: rgba(239, 68, 68, 0.45);
    opacity: 0.68;
  }
  .tile img {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    border-radius: 7px;
    display: block;
  }
  .empty {
    text-align: center;
    padding: 36px 16px;
    color: var(--t-muted);
    font-size: 14px;
  }
`;
var Pe = Object.defineProperty, Ae = Object.getOwnPropertyDescriptor, at = (s, t, e, i) => {
  for (var r = i > 1 ? void 0 : i ? Ae(t, e) : t, o = s.length - 1, a; o >= 0; o--)
    (a = s[o]) && (r = (i ? a(t, e, r) : a(r)) || r);
  return i && r && Pe(t, e, r), r;
};
let H = class extends P {
  constructor() {
    super(...arguments), this.path = "", this.alt = "", this.srcUrl = "", this.loadedPath = "";
  }
  updated(s) {
    if ((s.has("path") || s.has("api")) && this.api && this.path && this.path !== this.loadedPath) {
      this.loadedPath = this.path;
      const t = this.api.getCachedUrl(this.path);
      if (t) {
        this.srcUrl = t;
        const e = this.api.getCachedQuality(this.path);
        e && this.emitQuality(e);
        return;
      }
      this.srcUrl = "", this.load();
    }
  }
  emitQuality(s) {
    this.dispatchEvent(new CustomEvent("quality", { detail: s, bubbles: !0, composed: !0 }));
  }
  async load() {
    if (!this.api || !this.path) return;
    const s = this.path, t = await this.api.fetchMedia(s);
    !t || s !== this.path || (this.srcUrl = t.url, t.quality && this.emitQuality(t.quality));
  }
  render() {
    return this.srcUrl ? p`<img src=${this.srcUrl} alt=${this.alt} />` : p``;
  }
};
H.styles = D`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    img {
      width: 100%;
      height: 100%;
      object-fit: var(--img-fit, cover);
      border-radius: var(--img-radius, 0);
      display: block;
    }
  `;
at([
  $({ attribute: !1 })
], H.prototype, "api", 2);
at([
  $({ type: String })
], H.prototype, "path", 2);
at([
  $({ type: String })
], H.prototype, "alt", 2);
at([
  m()
], H.prototype, "srcUrl", 2);
H = at([
  I("frigate-auth-img")
], H);
var Ce = Object.defineProperty, Ee = Object.getOwnPropertyDescriptor, M = (s, t, e, i) => {
  for (var r = i > 1 ? void 0 : i ? Ee(t, e) : t, o = s.length - 1, a; o >= 0; o--)
    (a = s[o]) && (r = (i ? a(t, e, r) : a(r)) || r);
  return i && r && Ce(t, e, r), r;
};
let A = class extends P {
  constructor() {
    super(...arguments), this.faces = {}, this.people = [], this.selectedPerson = "", this.keepN = 8, this.keepSet = /* @__PURE__ */ new Set(), this.reasons = /* @__PURE__ */ new Map(), this.analyzing = !1, this.lastAnalyzedKey = "";
  }
  updated(s) {
    if (s.has("people") || s.has("faces")) {
      if (!this.selectedPerson || !this.people.includes(this.selectedPerson)) {
        const i = [...this.people].sort(
          (r, o) => {
            var a, l;
            return (((a = this.faces[o]) == null ? void 0 : a.length) || 0) - (((l = this.faces[r]) == null ? void 0 : l.length) || 0);
          }
        );
        this.selectedPerson = i[0] || "";
      }
      const t = this.faces[this.selectedPerson] || [], e = `${this.selectedPerson}:${this.keepN}:${t.length}`;
      this.selectedPerson && e !== this.lastAnalyzedKey && (this.lastAnalyzedKey = e, this.autoPick());
    }
  }
  async autoPick() {
    if (!this.api || !this.selectedPerson) return;
    const s = this.faces[this.selectedPerson] || [];
    if (!s.length) {
      this.keepSet = /* @__PURE__ */ new Set(), this.reasons = /* @__PURE__ */ new Map();
      return;
    }
    this.analyzing = !0, await Promise.all(s.map((i) => this.api.fetchMedia(`clips/faces/${this.selectedPerson}/${i}`)));
    const t = s.map((i) => ({
      filename: i,
      quality: this.api.getCachedQuality(`clips/faces/${this.selectedPerson}/${i}`)
    })), e = _e(t, this.keepN);
    this.keepSet = e.keepSet, this.reasons = e.reasons, this.analyzing = !1;
  }
  toggleTile(s) {
    const t = new Set(this.keepSet);
    t.has(s) ? t.delete(s) : t.add(s), this.keepSet = t;
  }
  emitPrune() {
    const t = (this.faces[this.selectedPerson] || []).filter((e) => !this.keepSet.has(e));
    t.length && this.dispatchEvent(
      new CustomEvent("prune", {
        detail: { person: this.selectedPerson, ids: t },
        bubbles: !0,
        composed: !0
      })
    );
  }
  emitMove(s, t) {
    !t || t === this.selectedPerson || this.dispatchEvent(
      new CustomEvent("move", {
        detail: { fromPerson: this.selectedPerson, file: s, toPerson: t },
        bubbles: !0,
        composed: !0
      })
    );
  }
  render() {
    if (!this.people.length)
      return p`<div class="empty">No registered people found in Frigate.</div>`;
    const s = this.people.includes(this.selectedPerson) ? this.selectedPerson : this.people[0], t = this.faces[s] || [], e = this.keepSet.size > 0 || t.length === 0, i = t.filter((a) => this.keepSet.has(a)).length, r = e ? Math.max(0, t.length - i) : 0, o = [...t].sort((a, l) => {
      var g, c, d, u;
      if (e) {
        const b = this.keepSet.has(a) ? 0 : 1, S = this.keepSet.has(l) ? 0 : 1;
        if (b !== S) return b - S;
      }
      const n = ((c = (g = this.api) == null ? void 0 : g.getCachedQuality(`clips/faces/${s}/${a}`)) == null ? void 0 : c.score) ?? 0;
      return (((u = (d = this.api) == null ? void 0 : d.getCachedQuality(`clips/faces/${s}/${l}`)) == null ? void 0 : u.score) ?? 0) - n;
    });
    return p`
      <div style="display:flex;flex-direction:column;gap:10px;">
        <div class="curate-bar">
          <div class="controls">
            <select
              .value=${s}
              @change=${(a) => {
      this.selectedPerson = a.target.value, this.lastAnalyzedKey = "", this.autoPick();
    }}
            >
              ${this.people.map(
      (a) => p`<option value=${a} ?selected=${a === s}>
                  ${a} (${(this.faces[a] || []).length})
                </option>`
    )}
            </select>

            <label style="font-size:12px;display:flex;align-items:center;gap:5px;">
              Keep best:
              <select
                .value=${String(this.keepN)}
                @change=${(a) => {
      this.keepN = Number(a.target.value) || 8, this.autoPick();
    }}
              >
                ${[3, 5, 8, 10, 12, 15, 20].map(
      (a) => p`<option value=${String(a)} ?selected=${this.keepN === a}>${a}</option>`
    )}
              </select>
            </label>

            <button class="btn primary" @click=${() => this.autoPick()}>
              ${this.analyzing ? "Analyzing…" : "Auto-Pick Diverse"}
            </button>
          </div>

          ${r > 0 ? p`<button class="btn danger" @click=${() => this.emitPrune()}>
                ✂ Prune ${r} Unkept
              </button>` : ""}
        </div>

        <div class="hint">
          Picks the sharpest, best-lit <strong>${this.keepN}</strong> shots while penalizing near-duplicates. Tap any tile to toggle Keep/Prune.
        </div>

        ${t.length === 0 ? p`<div class="empty">No photos registered for ${s}.</div>` : p`
              <div class="tile-grid">
                ${o.map((a) => {
      var c, d;
      const l = `clips/faces/${s}/${a}`, n = (d = (c = this.api) == null ? void 0 : c.getCachedQuality(l)) == null ? void 0 : d.score, h = !e || this.keepSet.has(a), g = this.reasons.get(a) || "";
      return p`
                    <div
                      class="tile ${e ? h ? "keep" : "prune" : ""}"
                      @click=${(u) => {
        u.target.closest("select") || this.toggleTile(a);
      }}
                    >
                      <div class="img-wrap">
                        <frigate-auth-img .api=${this.api} path=${l} alt=${s}></frigate-auth-img>
                        <span class="q-badge q-pos tier-${Yt(n)}">
                          ${n != null ? `Q:${n}` : "…"}
                        </span>
                      </div>
                      <div class="status-row">
                        <span class="curate-badge ${h ? "keep" : "prune"}">
                          ${h ? "Keep" : "Prune"}
                        </span>
                        <span style="font-size:10px;color:var(--t-muted);">${g}</span>
                      </div>
                      <select
                        style="width:100%;padding:3px;font-size:11px;"
                        @change=${(u) => {
        const b = u.target;
        b.value && (this.emitMove(a, b.value), b.value = "");
      }}
                      >
                        <option value="">Move to...</option>
                        ${this.people.filter((u) => u !== s).map((u) => p`<option value=${u}>${u}</option>`)}
                      </select>
                    </div>
                  `;
    })}
              </div>
            `}
      </div>
    `;
  }
};
A.styles = [
  rt,
  D`
      .curate-bar {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
        justify-content: space-between;
        background: var(--t-surface);
        border: 1px solid var(--t-border);
        border-radius: 12px;
        padding: 10px;
      }
      .controls {
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
      }
      .img-wrap {
        position: relative;
        width: 100%;
        aspect-ratio: 1;
        border-radius: 7px;
        overflow: hidden;
      }
      .q-pos {
        position: absolute;
        bottom: 4px;
        right: 4px;
      }
      .status-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 4px;
      }
      .curate-badge {
        font-size: 10px;
        font-weight: 800;
        padding: 2px 6px;
        border-radius: 5px;
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }
      .curate-badge.keep {
        background: rgba(34, 197, 94, 0.2);
        color: #4ade80;
      }
      .curate-badge.prune {
        background: rgba(239, 68, 68, 0.2);
        color: #f87171;
      }
      .hint {
        font-size: 12px;
        color: var(--t-muted);
      }
    `
];
M([
  $({ attribute: !1 })
], A.prototype, "api", 2);
M([
  $({ attribute: !1 })
], A.prototype, "faces", 2);
M([
  $({ type: Array })
], A.prototype, "people", 2);
M([
  m()
], A.prototype, "selectedPerson", 2);
M([
  m()
], A.prototype, "keepN", 2);
M([
  m()
], A.prototype, "keepSet", 2);
M([
  m()
], A.prototype, "reasons", 2);
M([
  m()
], A.prototype, "analyzing", 2);
A = M([
  I("frigate-curate-view")
], A);
var Te = Object.defineProperty, Me = Object.getOwnPropertyDescriptor, Y = (s, t, e, i) => {
  for (var r = i > 1 ? void 0 : i ? Me(t, e) : t, o = s.length - 1, a; o >= 0; o--)
    (a = s[o]) && (r = (i ? a(t, e, r) : a(r)) || r);
  return i && r && Te(t, e, r), r;
};
let z = class extends P {
  constructor() {
    super(...arguments), this.deck = [], this.people = [], this.selected = /* @__PURE__ */ new Set(), this.batchTarget = "";
  }
  toggle(s) {
    const t = new Set(this.selected);
    t.has(s) ? t.delete(s) : t.add(s), this.selected = t;
  }
  selectGroup(s) {
    const t = new Set(this.selected);
    s.slice(0, 24).forEach((e) => t.add(e.filename)), this.selected = t;
  }
  emitBatch(s) {
    const t = Array.from(this.selected);
    t.length && (s === "assign" && !this.batchTarget || (this.dispatchEvent(
      new CustomEvent("batch", {
        detail: { action: s, files: t, targetName: this.batchTarget },
        bubbles: !0,
        composed: !0
      })
    ), this.selected = /* @__PURE__ */ new Set()));
  }
  render() {
    const s = /* @__PURE__ */ new Map();
    for (const t of this.deck) {
      const e = t.predicted || "unknown", i = s.get(e) || [];
      i.push(t), s.set(e, i);
    }
    return s.size ? p`
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div style="font-size:12px;color:var(--t-muted);">
          Tip: Select 1–3 clear, varied angles per person to confirm, and trash blurry/duplicate frames to avoid overfitting Frigate.
        </div>

        <div class="toolbar">
          <span style="font-size:12px;">Selected: <strong>${this.selected.size}</strong></span>
          <select
            .value=${this.batchTarget}
            @change=${(t) => {
      this.batchTarget = t.target.value;
    }}
          >
            <option value="">Assign selected to...</option>
            ${this.people.map((t) => p`<option value=${t}>${t}</option>`)}
          </select>
          <button class="btn green" @click=${() => this.emitBatch("assign")}>Save Selected</button>
          <button class="btn danger" @click=${() => this.emitBatch("trash")}>Trash Selected</button>
        </div>

        ${Array.from(s.entries()).map(
      ([t, e]) => p`
            <div class="group-card">
              <div class="group-hdr">
                <strong>
                  ${t === "unknown" ? "Unknown Visitors" : `Predicted: ${t}`} (${e.length})
                </strong>
                <button class="btn" @click=${() => this.selectGroup(e)}>Select All</button>
              </div>
              <div class="tile-grid">
                ${e.slice(0, 24).map((i) => {
        const r = this.selected.has(i.filename);
        return p`
                    <div
                      class="tile ${r ? "selected" : ""}"
                      @click=${() => this.toggle(i.filename)}
                    >
                      <div class="img-box">
                        <frigate-auth-img
                          .api=${this.api}
                          path=${`clips/faces/train/${i.filename}`}
                          alt=${t}
                        ></frigate-auth-img>
                      </div>
                      <span class="score-pill tier-${Jt(i.score)}" style="text-align:center;">
                        ${Kt(i.score)}
                      </span>
                    </div>
                  `;
      })}
              </div>
            </div>
          `
    )}
      </div>
    ` : p`<div class="empty">No pending training images to group.</div>`;
  }
};
z.styles = [
  rt,
  D`
      .toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }
      .group-card {
        background: var(--t-surface);
        border: 1px solid var(--t-border);
        border-radius: 14px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .group-hdr {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .img-box {
        width: 100%;
        aspect-ratio: 1;
        border-radius: 7px;
        overflow: hidden;
      }
    `
];
Y([
  $({ attribute: !1 })
], z.prototype, "api", 2);
Y([
  $({ attribute: !1 })
], z.prototype, "deck", 2);
Y([
  $({ type: Array })
], z.prototype, "people", 2);
Y([
  m()
], z.prototype, "selected", 2);
Y([
  m()
], z.prototype, "batchTarget", 2);
z = Y([
  I("frigate-groups-view")
], z);
var Ne = Object.defineProperty, Ue = Object.getOwnPropertyDescriptor, L = (s, t, e, i) => {
  for (var r = i > 1 ? void 0 : i ? Ue(t, e) : t, o = s.length - 1, a; o >= 0; o--)
    (a = s[o]) && (r = (i ? a(t, e, r) : a(r)) || r);
  return i && r && Ne(t, e, r), r;
};
let T = class extends P {
  constructor() {
    super(...arguments), this.faces = {}, this.people = [], this.candidateFilename = "", this.filter = "", this.newName = "";
  }
  close() {
    this.dispatchEvent(new CustomEvent("close", { bubbles: !0, composed: !0 }));
  }
  pick(s) {
    const t = s.trim();
    t && this.dispatchEvent(new CustomEvent("pick", { detail: t, bubbles: !0, composed: !0 }));
  }
  render() {
    const s = this.filter.trim().toLowerCase(), t = s ? this.people.filter((e) => e.toLowerCase().includes(s)) : this.people;
    return p`
      <div
        class="backdrop"
        @click=${(e) => {
      e.target === e.currentTarget && this.close();
    }}
      >
        <div class="modal">
          <div class="hdr">
            <div class="title-wrap">
              <div class="thumb">
                <frigate-auth-img
                  .api=${this.api}
                  path=${`clips/faces/train/${this.candidateFilename}`}
                  alt="Candidate"
                ></frigate-auth-img>
              </div>
              <strong style="font-size:15px;">Who is this?</strong>
            </div>
            <button class="close-btn" @click=${() => this.close()}>✕ Close</button>
          </div>

          <input
            type="text"
            placeholder="Filter people..."
            .value=${this.filter}
            @input=${(e) => {
      this.filter = e.target.value;
    }}
          />

          <div class="grid">
            ${t.map((e) => {
      var r;
      const i = (r = this.faces[e]) == null ? void 0 : r[0];
      return p`
                <button class="person-choice" @click=${() => this.pick(e)}>
                  <div class="avatar">
                    ${i ? p`<frigate-auth-img
                          .api=${this.api}
                          path=${`clips/faces/${e}/${i}`}
                          alt=${e}
                        ></frigate-auth-img>` : ""}
                  </div>
                  <span>${e}</span>
                </button>
              `;
    })}
          </div>

          <div class="new-row">
            <input
              type="text"
              placeholder="New person name..."
              style="flex:1;"
              .value=${this.newName}
              @input=${(e) => {
      this.newName = e.target.value;
    }}
              @keydown=${(e) => {
      e.key === "Enter" && (e.preventDefault(), this.pick(this.newName));
    }}
            />
            <button class="btn primary" @click=${() => this.pick(this.newName)}>Save</button>
          </div>
        </div>
      </div>
    `;
  }
};
T.styles = [
  rt,
  D`
      .backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(5px);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
      }
      .modal {
        width: 100%;
        max-width: 420px;
        max-height: 84vh;
        background: var(--t-bg);
        border: 1px solid var(--t-border);
        border-radius: 20px;
        padding: 16px;
        box-shadow: 0 24px 56px rgba(0, 0, 0, 0.45);
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .hdr {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }
      .title-wrap {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .thumb {
        width: 42px;
        height: 42px;
        border-radius: 10px;
        overflow: hidden;
        background: #0d0f13;
        border: 1px solid var(--t-border);
      }
      .close-btn {
        background: var(--t-surface);
        color: var(--primary-text-color, #fff);
        border: 1px solid var(--t-border);
        border-radius: 999px;
        padding: 5px 11px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
        gap: 8px;
        max-height: 44vh;
        overflow-y: auto;
        padding-right: 2px;
      }
      .person-choice {
        background: var(--t-surface);
        border: 1px solid var(--t-border);
        border-radius: 12px;
        padding: 8px 6px;
        color: inherit;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        font-weight: 600;
        transition: transform 0.1s ease, border-color 0.1s ease;
      }
      .person-choice:hover {
        transform: translateY(-1px);
        border-color: #3b82f6;
      }
      .avatar {
        width: 52px;
        height: 52px;
        border-radius: 50%;
        overflow: hidden;
        background: var(--t-bg);
      }
      .new-row {
        display: flex;
        gap: 6px;
      }
    `
];
L([
  $({ attribute: !1 })
], T.prototype, "api", 2);
L([
  $({ attribute: !1 })
], T.prototype, "faces", 2);
L([
  $({ type: Array })
], T.prototype, "people", 2);
L([
  $({ type: String })
], T.prototype, "candidateFilename", 2);
L([
  m()
], T.prototype, "filter", 2);
L([
  m()
], T.prototype, "newName", 2);
T = L([
  I("frigate-reassign-modal")
], T);
var Oe = Object.defineProperty, ze = Object.getOwnPropertyDescriptor, C = (s, t, e, i) => {
  for (var r = i > 1 ? void 0 : i ? ze(t, e) : t, o = s.length - 1, a; o >= 0; o--)
    (a = s[o]) && (r = (i ? a(t, e, r) : a(r)) || r);
  return i && r && Oe(t, e, r), r;
};
let _ = class extends P {
  constructor() {
    super(...arguments), this.deck = [], this.faces = {}, this.people = [], this.showSnapshot = !1, this.showPicker = !1, this.dragDx = 0, this.dragDy = 0, this.dragging = !1, this.candQuality = null, this.startX = 0, this.startY = 0, this.lastTopFile = "";
  }
  updated() {
    var t, e;
    const s = ((t = this.deck[0]) == null ? void 0 : t.filename) ?? "";
    s !== this.lastTopFile && (this.lastTopFile = s, this.showSnapshot = !1, this.showPicker = !1, this.dragDx = 0, this.dragDy = 0, this.dragging = !1, this.candQuality = s ? ((e = this.api) == null ? void 0 : e.getCachedQuality(`clips/faces/train/${s}`)) ?? null : null);
  }
  togglePicker() {
    this.showPicker = !this.showPicker;
  }
  closePicker() {
    this.showPicker = !1;
  }
  get isPickerOpen() {
    return this.showPicker;
  }
  emit(s, t) {
    this.dispatchEvent(new CustomEvent(s, { detail: t, bubbles: !0, composed: !0 }));
  }
  onPointerDown(s) {
    s.target.closest("button") || (this.dragging = !0, this.startX = s.clientX, this.startY = s.clientY, s.currentTarget.setPointerCapture(s.pointerId));
  }
  onPointerMove(s) {
    this.dragging && (this.dragDx = s.clientX - this.startX, this.dragDy = s.clientY - this.startY);
  }
  onPointerUp() {
    if (!this.dragging) return;
    const s = this.dragDx, t = this.dragDy;
    this.dragging = !1, this.dragDx = 0, this.dragDy = 0, s > 85 ? this.emit("confirm") : s < -85 ? this.emit("trash") : t < -85 && (this.showPicker = !0);
  }
  render() {
    var g;
    const s = this.deck[0], t = this.deck[1];
    if (!s)
      return p`
        <div class="empty">
          <strong>Assign queue is empty!</strong><br />
          Switch to <strong>Curate</strong> to pick the best diverse shots for each person.
        </div>
      `;
    const e = !s.predicted || s.predicted === "unknown", i = Jt(s.score), r = this.people.filter((c) => c !== s.predicted).slice(0, 5), o = Math.max(0, Math.min(1, this.dragDx / 90)), a = Math.max(0, Math.min(1, -this.dragDx / 90)), l = Math.max(0, Math.min(1, -this.dragDy / 90)), n = this.dragging ? `translate(${this.dragDx}px, ${this.dragDy}px) rotate(${this.dragDx * 0.05}deg)` : "", h = this.showSnapshot && s.eventId ? `api/events/${s.eventId}/snapshot.jpg?bbox=1` : `clips/faces/train/${s.filename}`;
    return p`
      <div class="deck-stage">
        <div class="card-stack">
          ${t ? p`
                <div class="swipe-card under">
                  <div class="hero-wrap">
                    <frigate-auth-img
                      .api=${this.api}
                      path=${`clips/faces/train/${t.filename}`}
                      alt="Next"
                    ></frigate-auth-img>
                  </div>
                </div>
              ` : ""}

          <div
            class="swipe-card ${this.dragging ? "dragging" : ""}"
            style="transform:${n}"
            @pointerdown=${(c) => this.onPointerDown(c)}
            @pointermove=${(c) => this.onPointerMove(c)}
            @pointerup=${() => this.onPointerUp()}
            @pointercancel=${() => this.onPointerUp()}
          >
            <div class="stamp confirm" style="opacity:${o}">CONFIRM</div>
            <div class="stamp trash" style="opacity:${a}">TRASH</div>
            <div class="stamp reassign" style="opacity:${l}">WHO?</div>

            <div class="hero-wrap">
              ${this.showSnapshot ? "" : p`<span class="q-badge hero-q tier-${Yt((g = this.candQuality) == null ? void 0 : g.score)}">
                    ${this.candQuality ? `Q:${this.candQuality.score}` : "Q:…"}
                  </span>`}
              <frigate-auth-img
                .api=${this.api}
                path=${h}
                alt="Candidate face"
                @quality=${(c) => {
      this.candQuality = c.detail;
    }}
              ></frigate-auth-img>
              ${s.eventId ? p`<button
                    class="snap-toggle"
                    @click=${() => {
      this.showSnapshot = !this.showSnapshot;
    }}
                  >
                    ${this.showSnapshot ? "Show Face Crop" : "Full Snapshot"}
                  </button>` : ""}
            </div>

            <div class="card-body">
              <div class="pred-row">
                <span class="pred-title">${e ? "Who is this?" : `Is this ${s.predicted}?`}</span>
                <span class="score-pill tier-${i}">${Kt(s.score)}</span>
              </div>
              ${r.length ? p`
                    <div class="quick-pills">
                      ${r.map(
      (c) => p`<button class="quick-pill" @click=${() => this.emit("assign", c)}>
                            ${c}
                          </button>`
    )}
                      <button
                        class="quick-pill"
                        style="color:#60a5fa;"
                        @click=${() => {
      this.showPicker = !0;
    }}
                      >
                        + More…
                      </button>
                    </div>
                  ` : p`<div style="font-size:12px;color:var(--t-muted);">
                    Swipe right to confirm, left to trash, or tap ✎ to pick a person.
                  </div>`}
            </div>
          </div>
        </div>

        <div class="actions">
          <button class="act-btn small" title="Undo skip (Z)" @click=${() => this.emit("undo")}>↺</button>
          <button class="act-btn trash" title="Trash bad crop (←)" @click=${() => this.emit("trash")}>✕</button>
          <button
            class="act-btn reassign"
            title="Pick person (↑)"
            @click=${() => {
      this.showPicker = !this.showPicker;
    }}
          >
            ✎
          </button>
          <button class="act-btn small" title="Skip for now (↓)" @click=${() => this.emit("skip")}>↷</button>
          <button class="act-btn confirm" title="Confirm (→)" @click=${() => this.emit("confirm")}>✓</button>
        </div>
        <div class="kbd-hint">Swipe or keys: ← Trash · → Confirm · ↑ Pick Person · ↓ Skip · Z Undo</div>

        ${this.showPicker ? p`
              <frigate-reassign-modal
                .api=${this.api}
                .faces=${this.faces}
                .people=${this.people}
                candidateFilename=${s.filename}
                @close=${() => {
      this.showPicker = !1;
    }}
                @pick=${(c) => {
      this.showPicker = !1, this.emit("assign", c.detail);
    }}
              ></frigate-reassign-modal>
            ` : ""}
      </div>
    `;
  }
};
_.styles = [
  rt,
  D`
      .deck-stage {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
      }
      .card-stack {
        position: relative;
        width: 100%;
        max-width: 390px;
      }
      .swipe-card {
        position: relative;
        width: 100%;
        background: var(--t-surface);
        border: 1px solid var(--t-border);
        border-radius: 22px;
        overflow: hidden;
        box-shadow: 0 16px 36px rgba(0, 0, 0, 0.32);
        user-select: none;
        touch-action: none;
        transition: transform 0.18s ease-out;
      }
      .swipe-card.under {
        position: absolute;
        inset: 0;
        transform: scale(0.95) translateY(10px);
        opacity: 0.5;
        pointer-events: none;
      }
      .swipe-card.dragging {
        transition: none;
      }
      .stamp {
        position: absolute;
        top: 22px;
        padding: 6px 14px;
        border-radius: 10px;
        font-size: 20px;
        font-weight: 900;
        letter-spacing: 0.08em;
        border: 4px solid;
        pointer-events: none;
        z-index: 5;
      }
      .stamp.confirm {
        left: 18px;
        color: #22c55e;
        border-color: #22c55e;
        transform: rotate(-12deg);
      }
      .stamp.trash {
        right: 18px;
        color: #ef4444;
        border-color: #ef4444;
        transform: rotate(12deg);
      }
      .stamp.reassign {
        left: 50%;
        transform: translateX(-50%);
        color: #3b82f6;
        border-color: #3b82f6;
      }
      .hero-wrap {
        position: relative;
        width: 100%;
        aspect-ratio: 1;
        background: #0d0f13;
        --img-fit: contain;
      }
      .hero-q {
        position: absolute;
        top: 10px;
        left: 10px;
        z-index: 4;
      }
      .snap-toggle {
        position: absolute;
        bottom: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.7);
        color: #fff;
        border: 1px solid rgba(255, 255, 255, 0.25);
        border-radius: 999px;
        padding: 5px 10px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
      }
      .card-body {
        padding: 14px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .pred-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
      }
      .pred-title {
        font-size: 18px;
        font-weight: 700;
      }
      .quick-pills {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .quick-pill {
        background: var(--t-bg);
        color: inherit;
        border: 1px solid var(--t-border);
        border-radius: 999px;
        padding: 5px 10px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
      }
      .quick-pill:hover {
        border-color: #3b82f6;
      }
      .actions {
        display: flex;
        gap: 12px;
        align-items: center;
        justify-content: center;
      }
      .act-btn {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        border: 2px solid var(--t-border);
        background: var(--t-surface);
        color: var(--primary-text-color, #fff);
        font-size: 22px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.12s ease;
      }
      .act-btn:hover {
        transform: scale(1.08);
      }
      .act-btn.small {
        width: 42px;
        height: 42px;
        font-size: 16px;
      }
      .act-btn.trash {
        border-color: rgba(239, 68, 68, 0.5);
        color: #f87171;
      }
      .act-btn.confirm {
        border-color: rgba(34, 197, 94, 0.6);
        color: #4ade80;
      }
      .act-btn.reassign {
        border-color: rgba(59, 130, 246, 0.6);
        color: #60a5fa;
      }
      .kbd-hint {
        font-size: 11px;
        color: var(--t-muted);
        text-align: center;
      }
      @media (max-width: 600px), (hover: none) {
        .kbd-hint {
          display: none;
        }
      }
      @media (max-width: 600px) {
        .hero-wrap {
          aspect-ratio: auto;
          height: min(290px, 34vh);
        }
        .card-body {
          padding: 10px;
          gap: 7px;
        }
        .pred-title {
          font-size: 16px;
        }
        .actions {
          gap: 10px;
        }
        .act-btn {
          width: 50px;
          height: 50px;
          font-size: 20px;
        }
        .act-btn.small {
          width: 38px;
          height: 38px;
          font-size: 15px;
        }
      }
    `
];
C([
  $({ attribute: !1 })
], _.prototype, "api", 2);
C([
  $({ attribute: !1 })
], _.prototype, "deck", 2);
C([
  $({ attribute: !1 })
], _.prototype, "faces", 2);
C([
  $({ type: Array })
], _.prototype, "people", 2);
C([
  m()
], _.prototype, "showSnapshot", 2);
C([
  m()
], _.prototype, "showPicker", 2);
C([
  m()
], _.prototype, "dragDx", 2);
C([
  m()
], _.prototype, "dragDy", 2);
C([
  m()
], _.prototype, "dragging", 2);
C([
  m()
], _.prototype, "candQuality", 2);
_ = C([
  I("frigate-swipe-view")
], _);
var De = Object.defineProperty, qe = Object.getOwnPropertyDescriptor, w = (s, t, e, i) => {
  for (var r = i > 1 ? void 0 : i ? qe(t, e) : t, o = s.length - 1, a; o >= 0; o--)
    (a = s[o]) && (r = (i ? a(t, e, r) : a(r)) || r);
  return i && r && De(t, e, r), r;
};
let x = class extends P {
  constructor() {
    super(...arguments), this.config = { entry_id: "default", sort: "newest" }, this.faces = {}, this.deck = [], this.mode = "swipe", this.sort = "newest", this.loading = !1, this.error = "", this.toast = null, this.stats = { confirmed: 0, reassigned: 0, pruned: 0, trashed: 0, skipped: 0 }, this.history = [], this.keyHandler = (s) => this.handleKeyDown(s);
  }
  static getStubConfig() {
    return { entry_id: "default", sort: "newest" };
  }
  setConfig(s) {
    this.config = { entry_id: "default", sort: "newest", ...s }, this.sort = this.config.sort || "newest", this.api && (this.api.entryId = this.config.entry_id || "default");
  }
  updated(s) {
    if (s.has("hass") && this.hass) {
      const t = !this.api;
      this.api ? this.api.hass = this.hass : this.api = new Se(this.hass, this.config.entry_id || "default"), t && this.loadFaces();
    }
  }
  connectedCallback() {
    super.connectedCallback(), window.addEventListener("keydown", this.keyHandler);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), window.removeEventListener("keydown", this.keyHandler);
  }
  getPeople() {
    return Object.keys(this.faces).filter((s) => s !== "train").sort((s, t) => s.localeCompare(t));
  }
  makeToast(s, t) {
    const e = t && this.api ? this.api.getCachedUrl(`clips/faces/train/${t}`) : null;
    return { text: s, thumbUrl: e };
  }
  async loadFaces() {
    if (this.api) {
      this.loading = !0, this.error = "";
      try {
        const s = await this.api.getFaces();
        this.faces = s && typeof s == "object" ? s : {}, this.rebuildDeck();
      } catch (s) {
        this.error = s instanceof Error ? s.message : String(s);
      }
      this.loading = !1;
    }
  }
  rebuildDeck() {
    const t = (Array.isArray(this.faces.train) ? this.faces.train : []).map(we);
    this.sort === "lowest" ? t.sort((e, i) => (e.score ?? -1) - (i.score ?? -1)) : this.sort === "unknown_first" ? t.sort((e, i) => {
      const r = e.predicted === "unknown" ? 0 : 1, o = i.predicted === "unknown" ? 0 : 1;
      return r !== o ? r - o : i.ts - e.ts;
    }) : t.sort((e, i) => i.ts - e.ts), this.deck = t;
  }
  async handleConfirm() {
    var t;
    const s = this.deck[0];
    if (s) {
      if (!s.predicted || s.predicted === "unknown") {
        (t = this.swipeView) == null || t.togglePicker();
        return;
      }
      await this.classify(s, s.predicted, "confirmed");
    }
  }
  async classify(s, t, e) {
    if (!(!this.api || !t.trim())) {
      this.deck = this.deck.slice(1);
      try {
        await this.api.classifyTrainFile(t, s.filename), this.stats = { ...this.stats, [e]: this.stats[e] + 1 };
        const i = (this.faces.train || []).filter((o) => o !== s.filename), r = this.faces[t] ? [...this.faces[t]] : [];
        this.faces = { ...this.faces, train: i, [t]: r }, this.toast = this.makeToast(`Saved to "${t}"`, s.filename);
      } catch (i) {
        this.deck = [s, ...this.deck], this.toast = this.makeToast(`Error: ${i instanceof Error ? i.message : String(i)}`, s.filename);
      }
    }
  }
  async handleTrash() {
    const s = this.deck[0];
    if (!(!s || !this.api)) {
      this.deck = this.deck.slice(1);
      try {
        await this.api.deleteFaces("train", [s.filename]), this.stats = { ...this.stats, trashed: this.stats.trashed + 1 }, this.faces = { ...this.faces, train: (this.faces.train || []).filter((t) => t !== s.filename) }, this.toast = this.makeToast("Trashed bad crop", s.filename);
      } catch (t) {
        this.deck = [s, ...this.deck], this.toast = this.makeToast(`Delete error: ${t instanceof Error ? t.message : String(t)}`, s.filename);
      }
    }
  }
  handleSkip() {
    const s = this.deck[0];
    s && (this.deck = [...this.deck.slice(1), s], this.history.push(s), this.stats = { ...this.stats, skipped: this.stats.skipped + 1 }, this.toast = this.makeToast("Skipped for later", s.filename));
  }
  handleUndo() {
    const s = this.history.pop();
    if (!s) {
      this.toast = this.makeToast("Nothing to undo (only Skips can be undone)");
      return;
    }
    this.deck = [s, ...this.deck.filter((t) => t.filename !== s.filename)], this.stats = { ...this.stats, skipped: Math.max(0, this.stats.skipped - 1) }, this.toast = this.makeToast("Restored skipped face", s.filename);
  }
  async handleBatch(s) {
    if (!this.api) return;
    const { action: t, files: e, targetName: i } = s;
    this.toast = this.makeToast(`${t === "trash" ? "Deleting" : "Saving"} ${e.length} face(s)...`);
    try {
      if (t === "trash")
        await this.api.deleteFaces("train", e), this.stats = { ...this.stats, trashed: this.stats.trashed + e.length };
      else {
        for (const r of e)
          await this.api.classifyTrainFile(i, r);
        this.stats = { ...this.stats, confirmed: this.stats.confirmed + e.length };
      }
      await this.loadFaces(), this.toast = this.makeToast(`Updated ${e.length} face(s)`);
    } catch (r) {
      this.toast = this.makeToast(`Batch error: ${r instanceof Error ? r.message : String(r)}`);
    }
  }
  async handlePrune(s) {
    if (!this.api) return;
    const { person: t, ids: e } = s;
    this.toast = this.makeToast(`Pruning ${e.length} photo(s) from "${t}"...`);
    try {
      await this.api.deleteFaces(t, e), this.stats = { ...this.stats, pruned: this.stats.pruned + e.length };
      const i = new Set(e), r = (this.faces[t] || []).filter((o) => !i.has(o));
      this.faces = { ...this.faces, [t]: r }, this.toast = this.makeToast(`Kept ${r.length} best diverse photos for "${t}"`);
    } catch (i) {
      this.toast = this.makeToast(`Prune error: ${i instanceof Error ? i.message : String(i)}`);
    }
  }
  async handleMove(s) {
    if (!this.api) return;
    const { fromPerson: t, file: e, toPerson: i } = s;
    try {
      await this.api.reclassifyFace(t, e, i), this.toast = this.makeToast(`Moved ${e} to "${i}"`), await this.loadFaces();
    } catch (r) {
      this.toast = this.makeToast(`Move error: ${r instanceof Error ? r.message : String(r)}`);
    }
  }
  handleKeyDown(s) {
    var e, i, r;
    if (this.mode !== "swipe" || !this.deck.length) return;
    if (s.key === "Escape" && ((e = this.swipeView) != null && e.isPickerOpen)) {
      s.preventDefault(), this.swipeView.closePicker();
      return;
    }
    const t = (i = this.shadowRoot) == null ? void 0 : i.activeElement;
    t && (t.tagName === "INPUT" || t.tagName === "SELECT") || (s.key === "ArrowRight" ? (s.preventDefault(), this.handleConfirm()) : s.key === "ArrowLeft" ? (s.preventDefault(), this.handleTrash()) : s.key === "ArrowUp" ? (s.preventDefault(), (r = this.swipeView) == null || r.togglePicker()) : s.key === "ArrowDown" ? (s.preventDefault(), this.handleSkip()) : s.key.toLowerCase() === "z" && (s.preventDefault(), this.handleUndo()));
  }
  getCardSize() {
    return 6;
  }
  render() {
    const s = this.getPeople();
    return p`
      <ha-card>
        <div class="topbar">
          <div class="brand">
            <span class="pill-badge">Face Swipes</span>
            <span class="brand-sub">Frigate Face Trainer</span>
          </div>
          <div class="mode-tabs">
            <button class="mode-tab ${this.mode === "swipe" ? "active" : ""}" @click=${() => this.mode = "swipe"}>
              Swipe (${this.deck.length})
            </button>
            <button class="mode-tab ${this.mode === "curate" ? "active" : ""}" @click=${() => this.mode = "curate"}>
              Curate (${s.length})
            </button>
            <button class="mode-tab ${this.mode === "groups" ? "active" : ""}" @click=${() => this.mode = "groups"}>
              Groups
            </button>
          </div>
        </div>

        <div class="stats-bar">
          <div class="stat-pills">
            <span class="stat-pill">✓ ${this.stats.confirmed}</span>
            <span class="stat-pill">✎ ${this.stats.reassigned}</span>
            <span class="stat-pill">✂ ${this.stats.pruned}</span>
            <span class="stat-pill">✕ ${this.stats.trashed}</span>
          </div>
          <div style="display:flex;gap:6px;align-items:center;">
            <select
              .value=${this.sort}
              @change=${(t) => {
      this.sort = t.target.value, this.rebuildDeck();
    }}
            >
              <option value="newest">Newest first</option>
              <option value="lowest">Lowest score first</option>
              <option value="unknown_first">Unknown first</option>
            </select>
            <button class="btn" @click=${() => this.loadFaces()}>${this.loading ? "..." : "Refresh"}</button>
          </div>
        </div>

        ${this.toast ? p`
              <div class="toast">
                ${this.toast.thumbUrl ? p`<img class="toast-thumb" src=${this.toast.thumbUrl} alt="Last face" />` : ""}
                <span class="toast-tag">Last:</span>
                <span>${this.toast.text}</span>
              </div>
            ` : ""}
        ${this.error ? p`<div class="err">${this.error}</div>` : ""}

        ${this.mode === "swipe" ? p`<frigate-swipe-view
              .api=${this.api}
              .deck=${this.deck}
              .faces=${this.faces}
              .people=${s}
              @confirm=${() => this.handleConfirm()}
              @assign=${(t) => {
      const e = this.deck[0];
      e && this.classify(e, t.detail, "reassigned");
    }}
              @trash=${() => this.handleTrash()}
              @skip=${() => this.handleSkip()}
              @undo=${() => this.handleUndo()}
            ></frigate-swipe-view>` : ""}

        ${this.mode === "curate" ? p`<frigate-curate-view
              .api=${this.api}
              .faces=${this.faces}
              .people=${s}
              @prune=${(t) => this.handlePrune(t.detail)}
              @move=${(t) => this.handleMove(t.detail)}
            ></frigate-curate-view>` : ""}

        ${this.mode === "groups" ? p`<frigate-groups-view
              .api=${this.api}
              .deck=${this.deck}
              .people=${s}
              @batch=${(t) => this.handleBatch(t.detail)}
            ></frigate-groups-view>` : ""}
      </ha-card>
    `;
  }
};
x.styles = [
  rt,
  D`
      ha-card {
        background: var(--t-bg);
        border-radius: 18px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .topbar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 700;
        font-size: 16px;
      }
      .pill-badge {
        background: linear-gradient(135deg, #ec4899, #f97316);
        color: #fff;
        font-size: 10px;
        font-weight: 800;
        padding: 3px 8px;
        border-radius: 999px;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }
      .mode-tabs {
        display: flex;
        gap: 6px;
        background: var(--t-surface);
        padding: 4px;
        border-radius: 10px;
      }
      .mode-tab {
        border: none;
        background: transparent;
        color: var(--t-muted);
        padding: 6px 12px;
        border-radius: 7px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
      }
      .mode-tab.active {
        background: #2563eb;
        color: #fff;
      }
      .stats-bar {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
        justify-content: space-between;
        font-size: 12px;
        color: var(--t-muted);
      }
      .stat-pills {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .stat-pill {
        background: var(--t-surface);
        border: 1px solid var(--t-border);
        padding: 3px 9px;
        border-radius: 999px;
        font-variant-numeric: tabular-nums;
      }
      .toast {
        font-size: 12px;
        padding: 6px 10px;
        border-radius: 10px;
        background: rgba(37, 99, 235, 0.14);
        border: 1px solid rgba(37, 99, 235, 0.35);
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .toast-thumb {
        width: 28px;
        height: 28px;
        border-radius: 6px;
        object-fit: cover;
        flex-shrink: 0;
        background: #0d0f13;
      }
      .toast-tag {
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: #60a5fa;
        flex-shrink: 0;
      }
      .err {
        font-size: 13px;
        padding: 12px;
        border-radius: 10px;
        background: rgba(239, 68, 68, 0.15);
        border: 1px solid rgba(239, 68, 68, 0.35);
        color: #fca5a5;
      }
      @media (max-width: 600px) {
        ha-card {
          padding: 10px;
          gap: 8px;
          border-radius: 14px;
        }
        .brand {
          font-size: 14px;
        }
        .brand-sub {
          display: none;
        }
        .mode-tab {
          padding: 5px 9px;
          font-size: 11px;
        }
        .stats-bar {
          gap: 6px;
          font-size: 11px;
        }
        .stat-pill {
          padding: 2px 7px;
        }
      }
    `
];
w([
  $({ attribute: !1 })
], x.prototype, "hass", 2);
w([
  m()
], x.prototype, "config", 2);
w([
  m()
], x.prototype, "faces", 2);
w([
  m()
], x.prototype, "deck", 2);
w([
  m()
], x.prototype, "mode", 2);
w([
  m()
], x.prototype, "sort", 2);
w([
  m()
], x.prototype, "loading", 2);
w([
  m()
], x.prototype, "error", 2);
w([
  m()
], x.prototype, "toast", 2);
w([
  m()
], x.prototype, "stats", 2);
w([
  xe("frigate-swipe-view")
], x.prototype, "swipeView", 2);
x = w([
  I("frigate-face-swipes-card")
], x);
let pt = class extends P {
  render() {
    return p`<frigate-face-swipes-card .hass=${this.hass}></frigate-face-swipes-card>`;
  }
};
pt.styles = D`
    :host {
      display: block;
      padding: 16px;
      max-width: 960px;
      margin: 0 auto;
    }
    @media (max-width: 600px) {
      :host {
        padding: 6px;
      }
    }
  `;
w([
  $({ attribute: !1 })
], pt.prototype, "hass", 2);
pt = w([
  I("frigate-face-swipes-panel")
], pt);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "frigate-face-swipes-card",
  name: "Frigate Face Swipes Card",
  description: "Tinder & Google Photos-style face assignment and diverse Best-N curation tool for Frigate.",
  preview: !0
});
export {
  x as FrigateFaceSwipesCard,
  pt as FrigateFaceSwipesPanel
};
