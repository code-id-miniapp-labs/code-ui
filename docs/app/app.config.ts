export default defineAppConfig({
  ui: {
    colors: {
      primary: 'red',
      secondary: 'blue',
      success: 'green',
      warning: 'yellow',
      info: 'blue',
      error: 'red',
      neutral: 'slate'
    },
    footer: {
      slots: {
        root: 'border-t border-default',
        left: 'text-sm text-muted'
      }
    }
  },
  seo: {
    siteName: 'Code UI'
  },
  header: {
    title: 'Code UI',
    to: '/',
    logo: {
      alt: 'Code UI',
      light: '',
      dark: ''
    },
    search: true,
    colorMode: true,
    links: [{
      'icon': 'i-simple-icons-github',
      'to': 'https://github.com/code-id-miniapp-labs/code-ui',
      'target': '_blank',
      'aria-label': 'Code UI on GitHub'
    }]
  },
  footer: {
    credits: `Code UI • © ${new Date().getFullYear()}`,
    colorMode: false,
    links: [{
      'icon': 'i-simple-icons-github',
      'to': 'https://github.com/code-id-miniapp-labs/code-ui',
      'target': '_blank',
      'aria-label': 'Code UI on GitHub'
    }]
  },
  toc: {
    title: 'Table of Contents',
    bottom: {
      title: 'Community',
      edit: 'https://github.com/code-id-miniapp-labs/code-ui/edit/main/docs/content',
      links: [{
        icon: 'i-lucide-star',
        label: 'Star on GitHub',
        to: 'https://github.com/code-id-miniapp-labs/code-ui',
        target: '_blank'
      }, {
        icon: 'i-lucide-book-open',
        label: 'Code UI on GitHub',
        to: 'https://github.com/code-id-miniapp-labs/code-ui',
        target: '_blank'
      }]
    }
  }
})
