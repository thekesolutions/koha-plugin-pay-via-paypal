import Vue from 'vue'
import VueI18n from 'vue-i18n'
import koha_api from '~/koha-api.json'

Vue.use(VueI18n)

export default async ({ app, store, $axios }) => {
  // Set i18n instance on app
  // This way we can use it in middleware and pages asyncData/fetch
  // const loadedLanguages = ['en']
console.log(Vue)
console.log($axios)
  const messages = {
    'en': await $axios.$get(koha_api.path+'/static/locales/en.json')
  }

  const lang = document.querySelector('html').getAttribute('lang') || 'en'

  if (lang !== 'en') {
    try {
      messages[lang] = await $axios.$get(koha_api.path+'/static/locales/' + lang + '.json')
    } catch(e) {
      console.warn('WARNING: could not load locale for '+lang)
      console.log(e)
    }
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
