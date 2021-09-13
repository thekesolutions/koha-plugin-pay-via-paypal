export const state = () => ({
  list: []
})

export const actions = {
  async get_libraries ({ commit }) {
    const data = await this.$axios.$get('/api/v1/libraries?_per_page=-1')
    data.unshift({ library_id: null, name: 'All libraries' })
    commit('set_libraries', data)
  }
}

export const mutations = {
  set_libraries (state, data) {
    state.list = data
  }
}
