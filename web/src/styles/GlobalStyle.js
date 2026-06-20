import { createGlobalStyle } from 'styled-components'

const GlobalStyle = createGlobalStyle`
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background-color: ${p => p.theme.colors.bg};
    color: ${p => p.theme.colors.gray800};
    font-size: ${p => p.theme.font.base};
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }

  a { color: inherit; text-decoration: none; }
  button { border: none; background: none; cursor: pointer; font-family: inherit; }
  input, select, textarea { font-family: inherit; }
`

export default GlobalStyle
