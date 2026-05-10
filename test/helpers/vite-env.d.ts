declare module '*?url' {
  const url: string
  export default url
}

declare module '/dist/*.mjs' {
  const pica: any
  export default pica
}

interface Window {
  pica: any
}
