import {expect, fixture, html} from '@open-wc/testing'
import {attr} from '../src/attr.js'
import {controller} from '../src/controller.js'

describe('Attrable', () => {
  @controller
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  class InitializeAttrTest extends HTMLElement {
    @attr foo = 'hello'
    bar = 1

    getCount = 0
    setCount = 0
    #baz = 'world'
    get baz() {
      this.getCount += 1
      return this.#baz
    }
    @attr set baz(value: string) {
      this.setCount += 1
      this.#baz = value
    }
  }

  let instance
  beforeEach(async () => {
    instance = await fixture(html`<initialize-attr-test />`)
  })

  it('does not error during creation', () => {
    document.createElement('initialize-attr-test')
  })

  it('does not alter field values from their initial value', () => {
    expect(instance).to.have.property('foo', 'hello')
    expect(instance).to.have.property('bar', 1)
    expect(instance).to.have.property('baz', 'world')
  })

  it('reflects the initial value as an attribute, if not present', () => {
    expect(instance).to.have.attribute('data-foo', 'hello')
    expect(instance).to.not.have.attribute('data-bar')
    expect(instance).to.have.attribute('data-baz', 'world')
  })

  it('prioritises the value in the attribute over the property', async () => {
    instance = await fixture(html`<initialize-attr-test data-foo="goodbye" data-baz="universe" />`)
    expect(instance).to.have.property('foo', 'goodbye')
    expect(instance).to.have.attribute('data-foo', 'goodbye')
    expect(instance).to.have.property('baz', 'universe')
    expect(instance).to.have.attribute('data-baz', 'universe')
  })

  it('changes the property when the attribute changes', async () => {
    instance.setAttribute('data-foo', 'goodbye')
    await Promise.resolve()
    expect(instance).to.have.property('foo', 'goodbye')
    instance.setAttribute('data-baz', 'universe')
    await Promise.resolve()
    expect(instance).to.have.property('baz', 'universe')
  })

  it('changes the attribute when the property changes', () => {
    instance.foo = 'goodbye'
    expect(instance).to.have.attribute('data-foo', 'goodbye')
    instance.baz = 'universe'
    expect(instance).to.have.attribute('data-baz', 'universe')
  })

  describe('types', () => {
    it('infers boolean types from property and uses has/toggleAttribute', async () => {
      @controller
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class BooleanAttrTest extends HTMLElement {
        @attr foo = false
      }

      instance = await fixture(html`<boolean-attr-test />`)

      expect(instance).to.have.property('foo', false)
      expect(instance).to.not.have.attribute('data-foo')
      instance.setAttribute('data-foo', '7')
      await Promise.resolve()
      expect(instance).to.have.property('foo', true)
      instance.setAttribute('data-foo', 'hello')
      await Promise.resolve()
      expect(instance).to.have.property('foo', true)
      instance.setAttribute('data-foo', 'false')
      await Promise.resolve()
      expect(instance).to.have.property('foo', true)
      instance.removeAttribute('data-foo')
      await Promise.resolve()
      expect(instance).to.have.property('foo', false)
      instance.foo = true
      expect(instance).to.have.attribute('data-foo', '')
      instance.foo = false
      expect(instance).to.not.have.attribute('data-foo')
      instance.removeAttribute('data-foo')
      await Promise.resolve()
      expect(instance).to.have.property('foo', false)
    })

    it('avoids infinite loops', async () => {
      @controller
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class LoopAttrTest extends HTMLElement {
        count = 0
        @attr
        get foo() {
          return ++this.count
        }
        set foo(value) {
          this.count += 1
        }
      }
      instance = await fixture(html`<loop-attr-test />`)

      expect(instance).to.have.property('foo')
      instance.foo = 1
      instance.setAttribute('data-foo', '2')
      instance.foo = 3
      instance.setAttribute('data-foo', '4')
    })
  })

  describe('naming', () => {
    @controller
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    class NamingAttrTest extends HTMLElement {
      @attr fooBarBazBing = 'a'
      @attr URLBar = 'b'
      @attr ClipX = 'c'
    }

    beforeEach(async () => {
      instance = await fixture(html`<naming-attr-test />`)
    })

    it('converts camel cased property names to their HTML dasherized equivalents', async () => {
      expect(instance.fooBarBazBing).to.equal('a')
      instance.fooBarBazBing = 'bar'
      expect(instance.getAttributeNames()).to.include('data-foo-bar-baz-bing')
    })

    it('will intuitively dasherize acryonyms', async () => {
      expect(instance.URLBar).to.equal('b')
      instance.URLBar = 'bar'
      expect(instance.getAttributeNames()).to.include('data-url-bar')
    })

    it('dasherizes cap suffixed names correctly', async () => {
      expect(instance.ClipX).to.equal('c')
      instance.ClipX = 'bar'
      expect(instance.getAttributeNames()).to.include('data-clip-x')
    })
  })
})
