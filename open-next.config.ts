import type { OpenNextConfig } from '@opennextjs/cloudflare'

const config: OpenNextConfig = {
  default: {
    // Disable middleware worker to avoid WORKER_SELF_REFERENCE error
    // The server function worker won't try to bind to a non-existent middleware
    middleware: false,
  },
}

export default config
