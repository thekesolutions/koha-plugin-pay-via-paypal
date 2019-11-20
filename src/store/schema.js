import YAML from 'yaml'
import koha_api from '~/koha-api.json'

export const state = () => ({
  schema: {}
})

export const actions = {
  async get_schema ({ commit }) {
    let data = await this.$axios.$get(koha_api.path +'/static/schema/schema.yaml')
    // if (!data) {
    //   data = `
    //   $id: https://example.com/person.schema.json
    //   $schema: http://json-schema.org/draft-07/schema#
    //   type: object
    //   properties:
    //     generalOptions:
    //       type: object
    //       properties:
    //         PayPalSandboxMode:
    //           title: {{generalOps.mode}}
    //           type: boolean
    //     perLibraryOptions:
    //       type: object
    //       required: ['library_id']
    //       properties:
    //         library_id:
    //           type: string
    //           title: Library
    //           x-display: hidden
    //         active:
    //           title: {{perLibraryOps.active}}
    //           type: boolean
    //       dependencies:
    //         active:
    //           required: ['user', 'pwd', 'signature', 'library_id']
    //           properties:              
    //             user:
    //               title: {{perLibraryOps.user}}
    //               type: string
    //               x-display: custom-inherit
    //               x-class: row mx-0
    //             pwd:
    //               title: {{perLibraryOps.pass}}
    //               type: string
    //               x-display: custom-inherit
    //               x-class: row mx-0
    //             signature:
    //               title: {{perLibraryOps.sig}}
    //               type: string
    //               x-display: custom-inherit
    //               x-class: row mx-0
    //             charge_description:
    //               title: {{perLibraryOps.desc}}
    //               type: string
    //               x-display: custom-inherit
    //               x-class: row mx-0
    //             threshold:
    //               title: {{perLibraryOps.threshold}}
    //               type: number
    //               x-display: custom-inherit
    //               x-class: row mx-0
    //   `
    // }

    data = data.replace(/\{\{([\w.]+)\}\}/g, (str, p1) => {
      const trans = this.app.i18n.t(p1)
      return trans
    })
    commit('set_fields', YAML.parse(data))
  }
}

export const mutations = {
  set_fields (state, data) {
    state.schema = data
  }
}
