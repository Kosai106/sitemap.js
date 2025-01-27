import { XMLElement, XMLCData } from 'xmlbuilder';
// can't be const enum if we use babel to compile
// https://github.com/babel/babel/issues/8741
export enum EnumChangefreq {
  DAILY = 'daily',
  MONTHLY = 'monthly',
  ALWAYS = 'always',
  HOURLY = 'hourly',
  WEEKLY = 'weekly',
  YEARLY = 'yearly',
  NEVER = 'never',
}

export const CHANGEFREQ = [
  EnumChangefreq.ALWAYS,
  EnumChangefreq.HOURLY,
  EnumChangefreq.DAILY,
  EnumChangefreq.WEEKLY,
  EnumChangefreq.MONTHLY,
  EnumChangefreq.YEARLY,
  EnumChangefreq.NEVER
];

export enum EnumYesNo {
  YES = 'YES',
  NO = 'NO',
  Yes = 'Yes',
  No = 'No',
  yes = 'yes',
  no = 'no'
}

export enum EnumAllowDeny {
  ALLOW = 'allow',
  DENY = 'deny'
}

export type ICallback<E extends Error, T> = (err?: E, data?: T) => void;

export interface INewsItem {
  access?: 'Registration' | 'Subscription';
  publication: {
    name: string;
    language: string;
  };
  genres?: string;
  publication_date: string;
  title: string;
  keywords?: string;
  stock_tickers?: string;
}

export interface ISitemapImg {
  url: string;
  caption?: string;
  title?: string;
  geoLocation?: string;
  license?: string;
}

export interface IVideoItem {
  thumbnail_loc: string;
  title: string;
  description: string;
  content_loc?: string;
  player_loc?: string;
  'player_loc:autoplay'?: string;
  duration?: number;
  expiration_date?: string;
  rating?: string | number;
  view_count?: string | number;
  publication_date?: string;
  family_friendly?: EnumYesNo;
  tag?: string | string[];
  category?: string;
  restriction?: string;
  'restriction:relationship'?: string;
  gallery_loc?: string;
  'gallery_loc:title'?: string;
  price?: string;
  'price:resolution'?: string;
  'price:currency'?: string;
  'price:type'?: string;
  requires_subscription?: EnumYesNo;
  uploader?: string;
  platform?: string;
  'platform:relationship'?: EnumAllowDeny;
  live?: EnumYesNo;
}

export interface ILinkItem {
  lang: string;
  url: string;
}

export interface SitemapItemOptions {
  safe?: boolean;
  lastmodfile?: any;
  lastmodrealtime?: boolean;
  lastmod?: string;
  lastmodISO?: string;
  changefreq?: EnumChangefreq;
  fullPrecisionPriority?: boolean;
  priority?: number;
  news?: INewsItem;
  img?: string | ISitemapImg | (string | ISitemapImg)[];
  links?: ILinkItem[];
  expires?: string;
  androidLink?: string;
  mobile?: boolean | string;
  video?: IVideoItem | IVideoItem[];
  ampLink?: string;
  root?: XMLElement;
  url: string;
  cdata?: boolean;
}
