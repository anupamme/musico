import assert from 'node:assert/strict'
import test from 'node:test'

import { generateStreamingLinks } from './helpers.js'

test('Discogs albums offer a Spotify search when no direct Spotify URL exists', () => {
  const links = generateStreamingLinks({ name: 'Discovery', artists: ['Daft Punk'] })
  assert.equal(links.spotify, 'https://open.spotify.com/search/Daft%20Punk%20Discovery')
})

test('streaming links preserve a supplied Spotify album URL', () => {
  const spotify = 'https://open.spotify.com/album/example'
  assert.equal(generateStreamingLinks({ external_urls: { spotify } }).spotify, spotify)
  assert.deepEqual(generateStreamingLinks(null), {})
})
