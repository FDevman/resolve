import {
  defaultResolveConfig,
  build,
  start,
  watch,
  runTestcafe,
  merge
} from 'resolve-scripts'
import resolveModuleComments from 'resolve-module-comments'

import appConfig from './config.app'
import devConfig from './config.dev'
import prodConfig from './config.prod'
import testFunctionalConfig from './config.test-functional'

const launchMode = process.argv[2]

void (async () => {
  const moduleComments = resolveModuleComments()

  switch (launchMode) {
    case 'dev': {
      await watch(
        merge(defaultResolveConfig, appConfig, devConfig, moduleComments)
      )
      break
    }

    case 'build': {
      await build(
        merge(defaultResolveConfig, appConfig, prodConfig, moduleComments)
      )
      break
    }

    case 'start': {
      await start(
        merge(defaultResolveConfig, appConfig, prodConfig, moduleComments)
      )
      break
    }

    case 'test:functional': {
      await runTestcafe({
        resolveConfig: merge(
          defaultResolveConfig,
          appConfig,
          testFunctionalConfig,
          moduleComments
        ),
        functionalTestsDir: 'test/functional',
        browser: process.argv[3]
      })
      break
    }

    default: {
      throw new Error('Unknown option')
    }
  }
})().catch(error => {
  // eslint-disable-next-line no-console
  console.log(error)
  process.exit(1)
})
