import axios from '@nuxtjs/axios'

export const state = () => ({
  list: []
})

export const actions = {
  async get_libraries ({ commit }) {
    const { data } = await axios.get('/api/v1/libraries')
    commit('set_libraries', data)
  },
  set_libraries (state, data) {
    state.list = data
  }
}
