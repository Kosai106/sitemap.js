/* eslint-disable camelcase, semi */
/*!
 * Sitemap
 * Copyright(c) 2011 Eugene Kalinin
 * MIT Licensed
 */
import * as errors from './errors';
import { create, XMLElement } from 'xmlbuilder';
import SitemapItem from './sitemap-item';
import { ICallback, SitemapItemOptions } from './types';
import { gzip, gzipSync, CompressCallback } from 'zlib';
import { URL } from 'url'

export { errors };
export * from './sitemap-index'
export const version = '2.2.0'

/**
 * Shortcut for `new Sitemap (...)`.
 *
 * @param   {Object}        conf
 * @param   {String}        conf.hostname
 * @param   {String|Array}  conf.urls
 * @param   {Number}        conf.cacheTime
 * @param   {String}        conf.xslUrl
 * @param   {String}        conf.xmlNs
 * @return  {Sitemap}
 */
export function createSitemap(conf: {
  urls?: string | Sitemap["urls"];
  hostname?: string;
  cacheTime?: number;
  xslUrl?: string;
  xmlNs?: string;
}): Sitemap {
  // cleaner diff
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  return new Sitemap(conf.urls, conf.hostname, conf.cacheTime, conf.xslUrl, conf.xmlNs);
}

export class Sitemap {
  // This limit is defined by Google. See:
  // https://sitemaps.org/protocol.php#index
  limit = 5000
  xmlNs = ''
  cacheSetTimestamp = 0;
  hostname?: string;
  urls: (string | SitemapItemOptions)[]

  cacheResetPeriod: number;
  cache: string;
  xslUrl?: string;
  root: XMLElement;

  /**
   * Sitemap constructor
   * @param {String|Array}  urls
   * @param {String}        hostname    optional
   * @param {Number}        cacheTime   optional in milliseconds; 0 - cache disabled
   * @param {String}        xslUrl            optional
   * @param {String}        xmlNs            optional
   */
  constructor (
    urls?: string | Sitemap["urls"],
    hostname?: string,
    cacheTime?: number,
    xslUrl?: string,
    xmlNs?: string
  ) {

    // Base domain
    this.hostname = hostname;


    // Make copy of object
    if (urls) {
      this.urls = Array.isArray(urls) ? Array.from(urls) : [urls];
    } else {
      // URL list for sitemap
      this.urls = [];
    }

    // sitemap cache
    this.cacheResetPeriod = cacheTime || 0;
    this.cache = '';

    this.xslUrl = xslUrl;
    this.root = create('urlset', {encoding: 'UTF-8'})
    if (xmlNs) {
      this.xmlNs = xmlNs;
      const ns = this.xmlNs.split(' ')
      for (let attr of ns) {
        const [k, v] = attr.split('=')
        this.root.attribute(k, v.replace(/^['"]|['"]$/g, ''))
      }
    }
  }

  /**
   *  Clear sitemap cache
   */
  clearCache (): void {
    this.cache = '';
  }

  /**
   *  Can cache be used
   */
  isCacheValid (): boolean {
    let currTimestamp = Date.now();
    return !!(this.cacheResetPeriod && this.cache &&
      (this.cacheSetTimestamp + this.cacheResetPeriod) >= currTimestamp);
  }

  /**
   *  Fill cache
   */
  setCache (newCache: string): string {
    this.cache = newCache;
    this.cacheSetTimestamp = Date.now();
    return this.cache;
  }

  /**
   *  Add url to sitemap
   *  @param {String} url
   */
  add (url: string | SitemapItemOptions): number {
    return this.urls.push(url);
  }

  /**
   *  Delete url from sitemap
   *  @param {String} url
   */
  del (url: string | SitemapItemOptions): number {
    const indexToRemove: number[] = []
    let key = ''

    if (typeof url === 'string') {
      key = url;
    } else {
      // @ts-ignore
      key = url.url;
    }

    // find
    this.urls.forEach((elem, index): void => {
      if (typeof elem === 'string') {
        if (elem === key) {
          indexToRemove.push(index);
        }
      } else {
        if (elem.url === key) {
          indexToRemove.push(index);
        }
      }
    });

    // delete
    indexToRemove.forEach((elem): void => {this.urls.splice(elem, 1)});

    return indexToRemove.length;
  }

  /**
   *  Create sitemap xml
   *  @param {Function}     callback  Callback function with one argument — xml
   */
  toXML (callback?: ICallback<Error, string>): string|void {
    if (typeof callback === 'undefined') {
      return this.toString();
    }

    process.nextTick((): void => {
      try {
        callback(undefined, this.toString());
      } catch (err) {
        callback(err);
      }
    });
  }

  /**
   *  Synchronous alias for toXML()
   *  @return {String}
   */
  toString (): string {
    if (this.root.children.length) {
      this.root.children = []
    }
    if (!this.xmlNs) {
      this.root.att('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9')
      this.root.att('xmlns:news', 'http://www.google.com/schemas/sitemap-news/0.9')
      this.root.att('xmlns:xhtml', 'http://www.w3.org/1999/xhtml')
      this.root.att('xmlns:mobile', 'http://www.google.com/schemas/sitemap-mobile/1.0')
      this.root.att('xmlns:image', 'http://www.google.com/schemas/sitemap-image/1.1')
      this.root.att('xmlns:video', 'http://www.google.com/schemas/sitemap-video/1.1')
    }

    if (this.xslUrl) {
      this.root.instructionBefore('xml-stylesheet', `type="text/xsl" href="${this.xslUrl}"`)
    }

    if (this.isCacheValid()) {
      return this.cache;
    }

    // TODO: if size > limit: create sitemapindex

    this.urls.forEach((elem, index): void => {
      // SitemapItem
      // create object with url property
      let smi: SitemapItemOptions = (typeof elem === 'string') ? {'url': elem, root: this.root} : Object.assign({root: this.root}, elem)

      // insert domain name
      if (this.hostname) {
        smi.url = (new URL(smi.url, this.hostname)).toString();
        if (smi.img) {
          if (typeof smi.img === 'string') {
            // string -> array of objects
            smi.img = [{ url: smi.img }];
          } else if (!Array.isArray(smi.img)) {
            // object -> array of objects
            smi.img = [smi.img];
          }
          // prepend hostname to all image urls
          smi.img.forEach((img): void => {
            if (typeof img === 'string') {
              img = {url: img}
            }
            img.url = (new URL(img.url, this.hostname)).toString();
          });
        }
        if (smi.links) {
          smi.links.forEach((link): void => {
            link.url = (new URL(link.url, this.hostname)).toString();
          });
        }
      } else {
        smi.url = (new URL(smi.url)).toString();
      }
      const sitemapItem = new SitemapItem(smi)
      sitemapItem.buildXML()
    });

    return this.setCache(this.root.end())
  }

  toGzip (callback: CompressCallback): void;
  toGzip (): Buffer;
  toGzip (callback?: CompressCallback): Buffer|void {
    if (typeof callback === 'function') {
      gzip(this.toString(), callback);
    } else {
      return gzipSync(this.toString());
    }
  }
}

export { SitemapItem }
