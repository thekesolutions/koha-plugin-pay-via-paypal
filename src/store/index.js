export const state = () => ({
  confs: {},
  saved: false,
  clean: true
})

export const actions = {
  async get_configs ({ commit, dispatch }) {
    let { data } = await this.$axios.$get('/api/v1/contrib/paypal/configs')
    if (!data) {
      // throw new Error('Could not get configuration list')
      data = { PayPalSandboxMode: false, libraries: [{ library_id: null }, { library_id: 'CPL' }] }
    }
    commit('set_confs', data)
    dispatch('schema/get_schema')
    dispatch('libraries/get_libraries')
  },
  async save ({ commit }, data) {

  }
}

export const mutations = {
  set_confs (state, data) {
    state.confs = data
  }
}

// export const getters = {
//   configured_libraries (state) {
//     console.log(state)
//     const names = state.list.map(config => !config.library_id?{library_id: null, name: 'Default'}:state.libraries.list.filter(library => library.library_id == config.library_id).map(library))
//     return state.libraries.list.filter(library => configIds.includes(library.library_id))
//   }
// }
