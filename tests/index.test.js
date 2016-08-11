var jsdom = require('mocha-jsdom');
var expect = require('chai').expect;
var FormStore = require('../dist/formstore').default;
var domForm = require('./utils/dom-form').default;
var domFormCF = require('./utils/dom-form-cf').default;

describe('FormStore', function() {

  var $
  jsdom()

  before(function () {
    $ = require('jquery')
  })

  it('should work!', function(){
    expect(true).to.be.true;
  });

  it('should be able to parse URL', function() {
    const url = 'http://example.com:3000/pathname/something-else?search=test#hash';
    // console.log('Form Store ============== >', FormStore.default);
    const formStore = new FormStore();
    const result = formStore.parseUrl(url);
    expect(result).to.be.deep.equal({
      protocol: 'http:',
      hostname: 'example.com',
      port: '3000',
      pathname: '/pathname/something-else',
      search: '?search=test',
      hash: '#hash',
      host: 'example.com:3000'
    });
  });

  it('should get last part of pathname ', function(){
    const url = 'http://example.com:3000/pathname/something-else?search=test#hash';
    // console.log('Form Store ============== >', FormStore.default);
    const formStore = new FormStore();
    const result = formStore.parseUrl(url);
    const slugId = formStore.getSlugIdFromPath(result.pathname);
    expect(slugId).to.equal('something-else');
  });

  //https://www.npmjs.com/package/mocha-jsdom
  it('should retrieve form element by ID from the page', function(){
    const formStore = new FormStore();

    let _document = document;
    _document.body.innerHTML = domForm;

    const form = formStore.getForm('targetel');

    // console.log('doc', _document.documentElement.innerHTML);
    // console.log('form', _document.getElementById('targetel'));
    expect(form.id).to.equal('targetel');
  })

  /*
    It should look like:
    [
      { name: 'field_a', value: 'test field a' },
      { name: 'field_b', value: 'test field b' },
      { name: 'field_c', value: 'test field c' }
    ]
  */
  it('should get form values as a serialized array', function(){
    const formStore = new FormStore();
    let _document = document;
    _document.body.innerHTML = domForm;
    const form = formStore.getForm('targetel');

    const serialized = formStore.serializeForm(form, $);

    // expect(serialized).to.be.deep.equal([
    //   {name: 'field_a', value: 'test field a'},
    //   {name: 'field_b', value: 'test field b'},
    //   {name: 'field_c', value: 'test field c'},
    // ]);

    expect(serialized).to.be.deep.equal({
      field_a: 'test field a',
      field_b: 'test field b',
      field_c: 'test field c',
    })

  });

  it('should return window object', function(){
    const formStore = new FormStore();

    //Get slug ID
    const url = 'http://example.com:3000/pathname/some-slug?search=test#hash';
    const result = formStore.parseUrl(url);
    const slugId = formStore.getSlugIdFromPath(result.pathname);

    //Get form data
    let _document = document;
    _document.body.innerHTML = domForm;
    const form = formStore.getForm('targetel');
    const serialized = formStore.serializeForm(form, $);

    window.localStorage = {};
    window.localStorage.setItem = function(key, data) {
      window.localStorage[key] = data;
    };
    window.localStorage.getItem = function(key) {
      return window.localStorage[key];
    }

    const updated = formStore.saveFormToLocalStorage(slugId, serialized);

    expect(JSON.parse(updated)).to.be.deep.equal({
      field_a: 'test field a',
      field_b: 'test field b',
      field_c: 'test field c',
    });

  });

  it('should properly update localStorage with form data', function(){

    const formStore = new FormStore();

    //Construct DOM
    let _document = document;
    _document.body.innerHTML = domForm;

    _document.location.href = 'http://example.com:3000/pathname/some-slug?search=test#hash';

    window.localStorage = {};
    window.localStorage.setItem = function(key, data) {
      window.localStorage[key] = data;
    };
    window.localStorage.getItem = function(key) {
      return window.localStorage[key];
    }

    const updated = formStore.update('targetel', $);

    expect(JSON.parse(updated)).to.be.deep.equal({
      field_a: 'test field a',
      field_b: 'test field b',
      field_c: 'test field c',
    });

  });

  it('should get proper value requested', function(){

    const formStore = new FormStore();

    //Construct DOM
    let _document = document;
    _document.body.innerHTML = domForm;

    _document.location.href = 'http://example.com:3000/pathname/some-slug?search=test#hash';

    window.localStorage = {};
    window.localStorage.setItem = function(key, data) {
      window.localStorage[key] = data;
    };
    window.localStorage.getItem = function(key) {
      return window.localStorage[key];
    }

    const updated = formStore.update('targetel', $);

    const request = formStore.get('blank','field_a');

    expect(request).to.be.equal('test field a');

  });

  it('should properly set properties via the set method', function(){
    const fs = new FormStore();
    fs.set('pixelId', 'ABC123');

    expect(fs.pixelId).to.be.equal('ABC123');
  });

  it('should determine a purchase was not made - offer declined', function(){
    const fs = new FormStore();

    fs.set('pixeId', '914094612034513');

    fs.set('products', {
      669198: 9.95,
      669199: 21.95,
      669287: 39.90
    });

    fs.set('funnel', {
      'oto-page-96454729704957': {
        previous: 'order-form9704956',
        multiple: true,
        purchased: null
      },
      'oto-29704958': {
        previous: 'oto-page-96454729704957',
        multiple: false,
        purchased: 669287
      }
    });

    window.docUrl = 'https://hop.clickfunnels.com/oto-29704958?cf_uvid=9056407c187c397979101205467692ae&email=johnsmith@gmail.com#no-link';

    const success = fs._isOrderSuccess();

    expect(success).to.be.equal(false);

  });

  it('should determine a purchase was not made - card declined', function(){
    const fs = new FormStore();

    window.docUrl = 'https://hop.clickfunnels.com/oto-page-96454729704957?cf_uvid=9056407c187c397979101205467692ae&email=johnsmith@gmail.com&declined=true';

    const success = fs._isOrderSuccess();

    expect(success).to.be.equal(false);

  });

  it('should determine this is a conversion page', function(){
    const fs = new FormStore();

    fs.set('funnel', {
      'oto-page-96454729704957': {
        previous: 'order-form9704956',
        multiple: true,
        purchased: null
      },
      'oto-29704958': {
        previous: 'oto-page-96454729704957',
        multiple: false,
        purchased: 669287
      }
    });

    window.docUrl = 'https://hop.clickfunnels.com/oto-29704958?cf_uvid=9056407c187c397979101205467692ae&email=johnsmith@gmail.com#no-link';

    const result = fs._isConversionPage();

    expect(result).to.be.equal(true);

  });

  it('should determine this is NOT a conversion page', function(){
    const fs = new FormStore();

    fs.set('funnel', {
      'oto-page-96454729704957': {
        previous: 'order-form9704956',
        multiple: true,
        purchased: null
      },
      'oto-29704958': {
        previous: 'oto-page-96454729704957',
        multiple: false,
        purchased: 669287
      }
    });

    window.docUrl = 'https://hop.clickfunnels.com/oto-134134?cf_uvid=9056407c187c397979101205467692ae&email=johnsmith@gmail.com#no-link';

    const result = fs._isConversionPage();

    expect(result).to.be.equal(false);

  });

  it('should set conversion amount to 39.90', function(){

    const fs = new FormStore();

    fs.set('products', {
      669198: 9.95,
      669199: 21.95,
      669287: 39.90
    });

    fs.set('funnel', {
      'oto-page-96454729704957': {
        previous: 'order-form9704956',
        multiple: true,
        purchased: null
      },
      'oto-29704958': {
        previous: 'oto-page-96454729704957',
        multiple: false,
        purchased: 669287
      }
    });

    window.docUrl = 'https://hop.clickfunnels.com/oto-29704958?cf_uvid=9056407c187c397979101205467692ae&email=johnsmith@gmail.com';

    fs.preparePixel();

    const conversionAmount = fs.conversionAmount;

    expect(conversionAmount).to.be.equal(39.90);

  });

  it('should set conversion amount to 9.95', function(){

    const fs = new FormStore();

    fs.set('products', {
      669198: 9.95,
      669199: 21.95,
      669287: 39.90
    });

    fs.set('funnel', {
      'oto-page-96454729704957': {
        previous: 'order-form9704956',
        multiple: true,
        purchased: null
      },
      'oto-29704958': {
        previous: 'oto-page-96454729704957',
        multiple: false,
        purchased: 669287
      }
    });

    let _document = document;
    _document.body.innerHTML = domFormCF;

    window.prevUrl = 'https://hop.clickfunnels.com/order-form9704956?cf_uvid=9056407c187c397979101205467692ae&email=johnsmith@gmail.com';

    //Construct DOM
    window.docUrl = 'https://hop.clickfunnels.com/oto-page-96454729704957?cf_uvid=9056407c187c397979101205467692ae&email=johnsmith@gmail.com';

    window.localStorage = {};
    window.localStorage.setItem = function(key, data) {
      window.localStorage[key] = data;
    };
    window.localStorage.getItem = function(key) {
      return window.localStorage[key];
    }

    const updated = fs.update('targetel', $);

    fs.preparePixel();

    const conversionAmount = fs.conversionAmount;

    expect(conversionAmount).to.be.equal(9.95);

  });

});
