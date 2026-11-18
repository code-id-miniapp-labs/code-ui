import { withLeadingSlash } from 'ufo'
import { stringify } from 'minimark/stringify'
import { queryCollection } from '@nuxt/content/server'
import type { Collections } from '@nuxt/content'
import collections from '#content/manifest'

export default eventHandler(async (event) => {
  const params = getRouterParams(event)
  const slug = params['slug.md'] || params.slug
  if (!slug?.endsWith('.md')) {
    throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
  }

  let path = withLeadingSlash(slug.replace(/\.md$/, ''))
  if (path.endsWith('/index')) {
    path = path.substring(0, path.length - 6)
  }

  const pageCollections = Object.entries(collections)
    .filter(([_key, value]) => value.type === 'page')
    .map(([key]) => key) as (keyof Collections)[]

  let page = null
  for (const collection of pageCollections) {
    page = await queryCollection(event, collection).path(path).first()
    if (page) {
      break
    }
  }

  if (!page) {
    throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
  }

  if (page.body.value[0]?.[0] !== 'h1') {
    if (page.description) {
      page.body.value.unshift(['blockquote', {}, page.description])
    }
    if (page.title) {
      page.body.value.unshift(['h1', {}, page.title])
    }
  }

  setHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
  return stringify({ ...page.body, type: 'minimark' }, { format: 'markdown/html' })
})
