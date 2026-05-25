import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import deCommon from './locales/de/common.json'
import deAdmin from './locales/de/admin.json'
import deScreeningEditor from './locales/de/screening-editor.json'

void i18n.use(initReactI18next).init({
  resources: {
    de: {
      common: deCommon,
      admin: deAdmin,
      'screening-editor': deScreeningEditor,
    },
  },
  lng: 'de',
  fallbackLng: 'de',
  defaultNS: 'common',
  ns: ['common', 'admin', 'screening-editor'],
  interpolation: { escapeValue: false },
  returnNull: false,
})

export default i18n
