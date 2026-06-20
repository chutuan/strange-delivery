import { createGlobalStyle } from 'styled-components'

const GlobalStyle = createGlobalStyle`
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html { -webkit-text-size-adjust: 100%; }

  body {
    font-family: ${p => p.theme.font.family};
    background-color: ${p => p.theme.colors.bg};
    color: ${p => p.theme.colors.gray800};
    font-size: ${p => p.theme.font.base};
    line-height: 1.5;
    letter-spacing: -0.006em;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }

  h1, h2, h3, h4, h5 { letter-spacing: -0.02em; }

  a { color: inherit; text-decoration: none; }
  button { border: none; background: none; cursor: pointer; font-family: inherit; }
  input, select, textarea { font-family: inherit; }

  ::selection { background: rgba(249,115,22,0.18); }
`

export default GlobalStyle
