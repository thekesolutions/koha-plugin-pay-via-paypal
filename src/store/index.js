import koha_api from '~/koha-api.json'

export const state = () => ({
  general: {},
  libConfs: [],
  clean: true,
  snackbar: false
})

export const actions = {
  async get_configs ({ commit, dispatch }) {
    dispatch('schema/get_schema')
    dispatch('libraries/get_libraries')

    try {
      const data = await this.$axios.$get(koha_api.path +'/configs')
      
      if (!data.general) {
        data.general = { PayPalSandboxMode: false }
      }
      if (!data.libraries || !data.libraries.length) {
        // throw new Error('Could not get configuration list')
        data.libraries = [{ active: true, library_id: null }]
      }

      commit('general_confs', data.general)
      commit('library_confs', data.libraries)
    } catch (e) {
      console.log(e)
      commit('snackbar', { type: 'error', message: this.app.i18n.t('connection.noConfigs') })
    }
  },
  async save ({ commit, state }) {
    if (state.clean) {
      return commit('snackbar', { type: 'info', message: this.app.i18n.t('noSave') })
    }
    if (state.schema.schema.properties.generalOptions) {
      await this.$axios.$post(koha_api.path +'/configs/general', state.general)
    }
    if (state.schema.schema.properties.perLibraryOptions) {
      //Koha's openapi version does not allow nullable properties in objects
      //this hack is to filter null columns
      const confs = [];
      state.libConfs.forEach(conf => {
        const tmpcnf = {}
        Object.keys(conf)
          .filter(key => conf[key] !== null)
          .forEach(key => tmpcnf[key] = conf[key])
        confs.push(tmpcnf)
      })
      await this.$axios.$post(koha_api.path +'/configs/library', confs)
    }
    commit('clean')
    commit('snackbar', { type: 'success', message: this.app.i18n.t('saved') })
  }
}

export const mutations = {
  general_confs (state, data) {
    state.clean = false
    state.general = data
  },
  library_confs (state, data) {
    state.clean = false
    state.libConfs = data
  },
  snackbar (state, data) {
    state.snackbar = data
  },
  clean (state) {
    state.clean = true
  }
}