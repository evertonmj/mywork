import {getRequestConfig} from 'next-intl/server';
import en from './locales/en.json';
import pt from './locales/pt.json';
import es from './locales/es.json';

const supportedLocales = ['en', 'pt', 'es'] as const;
type SupportedLocale = (typeof supportedLocales)[number];

const MESSAGES: Record<SupportedLocale, Record<string, unknown>> = {
  en,
  pt,
  es
};

export default getRequestConfig(({locale}) => {
  const resolvedLocale: SupportedLocale = supportedLocales.includes(locale as SupportedLocale)
    ? (locale as SupportedLocale)
    : 'en';

  const messages = MESSAGES[resolvedLocale];

  return {locale: resolvedLocale, messages};
});
