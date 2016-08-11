
interface FormStore {
  pixelId: string;
  products: Object;
  funnel: Object;
  conversionAmount: number;
}

class FormStore {
  constructor(...args){
    /**
     * Sets the FB Pixel ID
     */
     this.pixelId = '';
    /**
     * Creates a mapping of product ID's and their prices in order to dynamically fill out the FB pixel.
     Example:
      {
        669198: 9.95,
        669199: 21.95,
        669287: 39.90
      }
     */
    this.products = {};
    /**
     * Creates a map reference for the funnel to handle firing tracking pixels at the appropriate times
     Example:
      {
        'oto-page-96454729704957': {
          previous: 'order-form9704956'
          type: 'upsell',
          conversion: true
        }
      }
     */
    this.funnel = {};

    this.conversionAmount = 0;
  }

  set(key, value) {
    this[key] = value;
  }

  get(id, key){
    const item = window.localStorage.getItem(id);
    const parsedValue = JSON.parse(item);
    const targetedValue = parsedValue[key];
    return targetedValue;
  }

  /**
   * Parses any URL and returns each base part of in an object.
   */
  parseUrl(url){
    const link = document.createElement('a');
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
  }
  /**
   * Retrieves the final path part to be used as a unique ID in localStorage for saving the form data, such as:
    {
      'slug-id': {form_data_here}
    }
   */
  getSlugIdFromPath(pathname:string) {
    const pathArray: Array<string> = pathname.split('/');
    const pathLength: number = pathArray.length;
    const lastIndex: number = pathLength - 1;
    const slugId: string = pathArray[lastIndex];
    return slugId;
  }

  /**
   * Retrieves the form from the page by ID
   */
   getForm(id:string) {
     const form = document.getElementById(id);
     return form;
   }

   /**
    * Returns a serialized form
    */
   serializeForm(form, jQuery) {
     let _$ = jQuery;
     const serialized = _$(form).serializeArray();
     let saveObject = {};

     for (var i = 0; i < serialized.length; i++) {
       let el = serialized[i];
       saveObject[el.name] = el.value;
     }
    //  console.log("Built serialized form", serialized);
     return saveObject;
   }

   /**
    * Saves the form data to local storage
    */
   saveFormToLocalStorage(slugId, serializedForm) {
     window.localStorage.setItem(slugId, JSON.stringify(serializedForm));
    //  console.log("Retrieve Local Storage", window.localStorage.getItem(slugId));
     return window.localStorage.getItem(slugId);
   }

   update(formId, jQuery){
     let _$ = jQuery;
     const url = window.prevUrl || window.docUrl || document.location.href;
     //Get Slug ID
     const result = this.parseUrl(url);
     const slugId = this.getSlugIdFromPath(result.pathname);
     //Prepare form data
     const form = this.getForm(formId);
     const serialized = this.serializeForm(form, _$);
     //Update localStorage
     const updatedData = this.saveFormToLocalStorage(slugId, serialized);

    //  console.log('Tracking updated form', updatedData);
     return updatedData;
   }

   track(formId, jQuery){
     const _this = this;
     let _$ = jQuery;
     const form = this.getForm(formId);
     _$(form).on('submit', function(){
        _this.update(formId, _$);
     });
   }



   /**
    * Determines if an order has been successfully placed by a condition that the person is currently on a page whose previous page is an order page and there is a product ID in the form data.
    */
   _isOrderSuccess() {
      const url = window.docUrl || document.location.href;

      const offerDeclined = url.indexOf('no-link') > -1 ? true : false;
      const cardDeclined = url.indexOf('declined=true') > -1 ? true : false;
      const urlParsed = this.parseUrl(url);

      const slugId = this.getSlugIdFromPath(urlParsed.pathname);

      if ( cardDeclined || offerDeclined )
        return false;

      return true;
   }

   _isConversionPage() {
       const url = window.docUrl || document.location.href;
       const urlParsed = this.parseUrl(url);
       const slugId = this.getSlugIdFromPath(urlParsed.pathname);

       if ( typeof this.funnel[slugId]  !== 'undefined' )
        return true;

      return false;
   }

   buildPixel(orderAmount:number) {
     //build the pixel, nah!
   }
   /**
    * Determines which pixel to fire based on whether the funnel page is a conversion page and whether or not the purchase was successful.  Fills in the purchase amount dynamically
    */
   preparePixel() {
      const url = window.docUrl || document.location.href;
      const urlParsed = this.parseUrl(url);
      const slugId = this.getSlugIdFromPath(urlParsed.pathname);

      const isConversion = this._isConversionPage();
      //It's a conversion page, was a purchase successfully made?
      if ( isConversion ){
        const isOrderSuccess = this._isOrderSuccess();
        //Yes, a purchase was successful, fire the conversion pixelId
        if ( isOrderSuccess ){
            const funnelItem = this.funnel[slugId];
            if ( funnelItem.multiple === true ){
              const productId = this.get(funnelItem.previous, 'purchase[product_ids][]');
              const productPrice = this.products[productId];
              this.conversionAmount = productPrice;
            }else{
              const productId = funnelItem.purchased;
              const productPrice = this.products[productId];
              this.conversionAmount = productPrice;
            }
        }else{
            //No, bummer, fire the view pixel
            this.conversionAmount = 0;
        }
      //It's not a conversion page, fire the basic view pixel
      }else{
        this.conversionAmount = 0;
      }
  }

}
let exports = exports || {};
export default FormStore;
