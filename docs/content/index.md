---
title: Code UI
description: A Tailwind-styled WeChat MiniProgram component library.
---

::u-page-hero{class="dark:bg-gradient-to-b from-neutral-900 to-neutral-950"}
---
orientation: horizontal
---
#top
:hero-background
:stars-bg

#title
Build Beautiful [MiniProgram UIs]{.text-primary .font-lexend}.

#description
A Tailwind-styled WeChat MiniProgram component library. Powered by finite state machines, variant-based theming, and compile-time WXML optimization with [@code-ui](https://github.com/code-id-miniapp-labs/code-ui).

#links
  :::u-button
  ---
  to: /getting-started
  size: xl
  trailing-icon: i-lucide-arrow-right
  ---
  Get started
  :::

  :::u-button
  ---
  icon: i-simple-icons-github
  color: neutral
  variant: outline
  size: xl
  to: https://github.com/code-id-miniapp-labs/code-ui
  target: _blank
  ---
  View on GitHub
  :::

#default
```html [index.wxml]
<c-card
  title="Welcome to Code UI"
  description="Tailwind-styled WeChat MiniProgram components."
>
  <c-button label="Get started" color="primary" />
</c-card>
```
::

::u-page-section{class="dark:bg-neutral-950"}
#title
Powered by @code-ui architecture

#links
  :::u-button
  ---
  color: neutral
  size: lg
  to: /getting-started
  trailingIcon: i-lucide-arrow-right
  variant: subtle
  ---
  Explore Code UI
  :::

#features
  :::u-page-feature
  ---
  icon: i-lucide-palette
  ---
  #title
  35+ MiniProgram Components

  #description
  From buttons and cards to tabs, drawers, and form controls, everything is styled and accessible out of the box.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-cpu
  ---
  #title
  Finite State Machines

  #description
  Interactive components are driven by finite state machines, keeping runtime components thin and predictable.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-layers
  ---
  #title
  Variant-Based Theming

  #description
  Customize any component globally with `cui.config.ts`, or per instance with the `ui` and `class` props.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-zap
  ---
  #title
  Auto-Imported Components

  #description
  The Vite plugin scans your WXML templates and injects `usingComponents` entries at build time.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-sliders-horizontal
  ---
  #title
  Compile-Time Slot Detection

  #description
  The compiler detects which named slots you use, so components switch between prop content and slot content automatically.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-moon
  ---
  #title
  Dark Mode Ready

  #description
  Semantic color tokens keep components consistent in light and dark modes.
  :::
::

::u-page-section{class="dark:bg-gradient-to-b from-neutral-950 to-neutral-900"}
  :::u-page-c-t-a
  ---
  links:
    - label: Start building
      to: '/getting-started'
      trailingIcon: i-lucide-arrow-right
  title: Ready to build with Code UI?
  description: Start building accessible, Tailwind-styled WeChat MiniProgram apps with @code-ui today.
  class: dark:bg-neutral-950
  ---

  :stars-bg
  :::
::
