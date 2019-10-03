import YAML from 'yaml'

export const state = () => ({
  schema: {}
})

export const actions = {
  async get_schema ({ commit }) {
    let { data } = await this.$axios.$get('/api/v1/contrib/paypal/static/schema')
    if (!data) {
      /*
      data = `
      $id: https://example.com/person.schema.json
      $schema: http://json-schema.org/draft-07/schema#
      title: Configure plugin
      description: Configure PayPal plugin
      type: object
      allOf:
      -  $ref: "#/definitions/generalOptions"
      -  $ref: "#/definitions/perLibraryOptions"
      definitions:
        generalOptions:
          title: General options
          type: object
          properties:
            PayPalSandboxMode:
              title: Sandbox mode?
              type: boolean
        perLibraryOptions:
          title: Per library options
          type: object
          properties:
            libraries:
              type: array
              items:
                type: object
                required: ['user', 'pwd', 'signature']
                properties:
                  active:
                    title: Is Active?
                    type: boolean
                  user:
                    title: PayPal user
                    type: string
                  pwd:
                    title: PayPal password
                    type: string
                  signature:
                    title: PayPal signature
                    type: string
                  charge_description:
                    title: Charge description
                    type: string
                  threshold:
                    title: Mimimum payment threshold
                    type: number
      `
      */
      data = `
      {
        "id": "https://example.com/arrays.schema.json",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "description": "A representation of a person, company, organization, or place",
        "type": "object",
        "properties": {
          "fruits": {
            "type": "array",
            "description": "This is a simple array of strings",
            "items": {
              "type": "string"
            }
          },
          "sizes": {
            "type": "array",
            "items": {
              "type": "string",
              "enum": [
                "small",
                "medium",
                "large"
              ]
            },
            "minItems": 1
          },
          "vegetables": {
            "type": "array",
            "description": "A list of vegetables as editable objects.",
            "items": {
              "$ref": "#/definitions/veggie"
            }
          }
        },
        "definitions": {
          "veggie": {
            "type": "object",
            "required": [
              "veggieName",
              "veggieLike"
            ],
            "properties": {
              "veggieName": {
                "type": "string",
                "description": "The name of the vegetable."
              },
              "veggieLike": {
                "type": "boolean",
                "description": "Do I like this vegetable?"
              }
            }
          }
        }
      }
      `
    }
    commit('set_fields', YAML.parse(data))
  }
}

export const mutations = {
  set_fields (state, data) {
    state.schema = data
  }
}
