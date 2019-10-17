import Vue from 'vue'
import VueI18n from 'vue-i18n'

Vue.use(VueI18n)

export default ({ app, store }) => {
  // Set i18n instance on app
  // This way we can use it in middleware and pages asyncData/fetch
  // const loadedLanguages = ['en']

  const messages = {
    'en': require('~/locales/en.json')
  }

  const lang = document.querySelector('html').getAttribute('lang') || 'en'

  if (lang !== 'en') {
    messages[lang] = require('~/locales/' + lang + '.json')
  }

  app.i18n = new VueI18n({
    locale: lang,
    fallbackLocale: 'en',
    messages
  })

/*  function setI18nLanguage (lang) {
    app.i18n.locale = lang
    app.$axios.defaults.headers.common['Accept-Language'] = lang
    document.querySelector('html').setAttribute('lang', lang)
    return lang
  }

  app.i18n.lazyLoadLanguage = (lang) => {
    // If the language was already loaded
    if (loadedLanguages.includes(lang)) {
      return Promise.resolve(setI18nLanguage(lang))
    }

    // If the language hasn't been loaded yet
    return import(`~/locales/${lang}.json`).then(
      (messages) => {
        app.i18n.setLocaleMessage(lang, messages)
        loadedLanguages.push(lang)
        return setI18nLanguage(lang)
      }
    )
  }

  if (!loadedLanguages.includes(app.i18n.locale)) {
    app.i18n.lazyLoadLanguage(app.i18n.locale)
  } */
}
