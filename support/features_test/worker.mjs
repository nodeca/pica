import { get_supported_features } from '../../src/supported_features.ts'

get_supported_features().then(
  features => {
    console.log('worker supported_features:', features)
    console.table(features)
  },
  err => console.error(err)
)
