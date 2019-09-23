<template>
  <v-layout>
    <v-flex class="text-center">
      <configure v-if="child=='configure'" />
    </v-flex>
  </v-layout>
</template>

<script>
import configure from '~/components/configure'
const components = {
  configure
}
export default {
  components,
  computed: {
    child () {
      if (/configure/i.test(window.location)) {
        return 'configure'
      } else {
        return ''
      }
    }
  },
  created () {
    if (!(Object.keys(components)).includes(this.child)) {
      throw new Error({ statusCode: 404, message: 'No component found' })
    }
  }
}
</script>
