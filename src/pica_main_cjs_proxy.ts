import pica, { Pica } from './pica_main'

const picaWithClass = pica as typeof pica & { Pica: typeof Pica }
picaWithClass.Pica = Pica

export default picaWithClass
