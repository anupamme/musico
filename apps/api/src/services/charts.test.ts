import { expect, test } from 'bun:test'

import { parseBillboard200Albums } from './charts'

const row = (rank: number, name: string, artist: string, weeks: number) => `
  <div class="chart-item" id="song-${rank}">
    <div class="chart-item-position">${rank}</div>
    <h2 class="chart-item-headline">${name}</h2>
    <h3 class="chart-item-subheadline">${artist}</h3>
    <div class="chart-item-last-week">2</div>
    <div class="chart-item-peak-pos">1</div>
    <div class="chart-item-weeks-on">${weeks}</div>
  </div>`

test('chart ranks come from row positions rather than historical statistics', () => {
  const html = row(1, 'Dandelion', 'Ella Langley', 24)
    + row(2, 'That&#39;s Just Me', 'Riley Green', 71)
    + row(3, '21', 'Adele', 15)
  expect(parseBillboard200Albums(html)).toEqual([
    { rank: 1, name: 'Dandelion', artist: 'Ella Langley' },
    { rank: 2, name: "That's Just Me", artist: 'Riley Green' },
    { rank: 3, name: '21', artist: 'Adele' },
  ])
  expect(parseBillboard200Albums(html, 2)).toHaveLength(2)
})

test('an incomplete chart response fails instead of producing unrelated page text', () => {
  expect(() => parseBillboard200Albums('<div>1</div><h2>News</h2><h3>Author</h3>')).toThrow()
  expect(() => parseBillboard200Albums('<div class="chart-item"><div class="chart-item-position">1</div></div>')).toThrow()
})
