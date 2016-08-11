"use strict";
var FormStore = (function () {
    function FormStore() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        this.pixelId = '';
        this.products = {};
        this.funnel = {};
        this.conversionAmount = 0;
    }
    FormStore.prototype.set = function (key, value) {
        this[key] = value;
    };
    FormStore.prototype.get = function (id, key) {
        var item = window.localStorage.getItem(id);
        var parsedValue = JSON.parse(item);
        var targetedValue = parsedValue[key];
        return targetedValue;
    };
    FormStore.prototype.parseUrl = function (url) {
        var link = document.createElement('a');
        link.href = url;
        return {
            protocol: link.protocol,
            hostname: link.hostname,
            port: link.port,
            pathname: link.pathname,
            search: link.search,
            hash: link.hash,
            host: link.host
        };
    };
    FormStore.prototype.getSlugIdFromPath = function (pathname) {
        var pathArray = pathname.split('/');
        var pathLength = pathArray.length;
        var lastIndex = pathLength - 1;
        var slugId = pathArray[lastIndex];
        return slugId;
    };
    FormStore.prototype.getForm = function (id) {
        var form = document.getElementById(id);
        return form;
    };
    FormStore.prototype.serializeForm = function (form, jQuery) {
        var _$ = jQuery;
        var serialized = _$(form).serializeArray();
        var saveObject = {};
        for (var i = 0; i < serialized.length; i++) {
            var el = serialized[i];
            saveObject[el.name] = el.value;
        }
        return saveObject;
    };
    FormStore.prototype.saveFormToLocalStorage = function (slugId, serializedForm) {
        window.localStorage.setItem(slugId, JSON.stringify(serializedForm));
        return window.localStorage.getItem(slugId);
    };
    FormStore.prototype.update = function (formId, jQuery) {
        var _$ = jQuery;
        var url = window.prevUrl || window.docUrl || document.location.href;
        var result = this.parseUrl(url);
        var slugId = this.getSlugIdFromPath(result.pathname);
        var form = this.getForm(formId);
        var serialized = this.serializeForm(form, _$);
        var updatedData = this.saveFormToLocalStorage(slugId, serialized);
        return updatedData;
    };
    FormStore.prototype.track = function (formId, jQuery) {
        var _this = this;
        var _$ = jQuery;
        var form = this.getForm(formId);
        _$(form).on('submit', function () {
            _this.update(formId, _$);
        });
    };
    FormStore.prototype._isOrderSuccess = function () {
        var url = window.docUrl || document.location.href;
        var offerDeclined = url.indexOf('no-link') > -1 ? true : false;
        var cardDeclined = url.indexOf('declined=true') > -1 ? true : false;
        var urlParsed = this.parseUrl(url);
        var slugId = this.getSlugIdFromPath(urlParsed.pathname);
        if (cardDeclined || offerDeclined)
            return false;
        return true;
    };
    FormStore.prototype._isConversionPage = function () {
        var url = window.docUrl || document.location.href;
        var urlParsed = this.parseUrl(url);
        var slugId = this.getSlugIdFromPath(urlParsed.pathname);
        if (typeof this.funnel[slugId] !== 'undefined')
            return true;
        return false;
    };
    FormStore.prototype.buildPixel = function (orderAmount) {
    };
    FormStore.prototype.preparePixel = function () {
        var url = window.docUrl || document.location.href;
        var urlParsed = this.parseUrl(url);
        var slugId = this.getSlugIdFromPath(urlParsed.pathname);
        var isConversion = this._isConversionPage();
        if (isConversion) {
            var isOrderSuccess = this._isOrderSuccess();
            if (isOrderSuccess) {
                var funnelItem = this.funnel[slugId];
                if (funnelItem.multiple === true) {
                    var productId = this.get(funnelItem.previous, 'purchase[product_ids][]');
                    var productPrice = this.products[productId];
                    this.conversionAmount = productPrice;
                }
                else {
                    var productId = funnelItem.purchased;
                    var productPrice = this.products[productId];
                    this.conversionAmount = productPrice;
                }
            }
            else {
                this.conversionAmount = 0;
            }
        }
        else {
            this.conversionAmount = 0;
        }
    };
    return FormStore;
}());
var exports = exports || {};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = FormStore;
