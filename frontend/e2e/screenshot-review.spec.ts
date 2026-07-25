import { expect, test, type Page } from '@playwright/test'
import path from 'node:path'

test.describe.configure({ mode: 'serial' })

const outputDirectory = path.resolve(
  import.meta.dirname,
  '..',
  '..',
  '.tmp',
  'ui-review',
)
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAARElEQVR4nGP8z8AARLJgFIyCUUBPAAA2QQE/7iZ8GAAAAABJRU5ErkJggg==',
  'base64',
)

async function capture(page: Page, name: string) {
  await page.screenshot({
    path: path.join(outputDirectory, `${name}.png`),
    fullPage: true,
    animations: 'disabled',
  })
}

async function setPalette(page: Page) {
  await page.getByRole('button', { name: 'Start manually' }).click()
  for (let index = 0; index < 4; index += 1) {
    await page.getByRole('button', { name: 'Add color' }).click()
  }
  const colors = ['#6A5BCF', '#F2763F', '#141D29', '#F5F0E8', '#80FF00']
  for (let index = 0; index < colors.length; index += 1) {
    const input = page.getByRole('textbox', {
      name: `Color ${index + 1}`,
      exact: true,
    })
    await input.fill(colors[index])
    await input.blur()
  }
}

test('@screenshots fixture-driven UI review', async ({ page }) => {
  test.skip(
    !process.env.COLORCRAFT_SCREENSHOTS,
    'Run through pnpm review:screenshots.',
  )
  await page.goto('/?view=create')
  await page.locator('.sidebar-theme select').selectOption('dark')
  await capture(page, '01-create-empty-dark')
  await page.locator('.sidebar-theme select').selectOption('light')
  await capture(page, '02-create-empty-light')

  await page.route('**/api/extract-colors?*', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 700))
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        count: 3,
        colors: [
          {
            hex: '#6A5BCF',
            rgb: { r: 106, g: 91, b: 207 },
            hsl: { h: 248, s: 53, l: 58 },
            population: 0.5,
            pixelCount: 50,
          },
          {
            hex: '#F2763F',
            rgb: { r: 242, g: 118, b: 63 },
            hsl: { h: 18, s: 87, l: 60 },
            population: 0.3,
            pixelCount: 30,
          },
          {
            hex: '#141D29',
            rgb: { r: 20, g: 29, b: 41 },
            hsl: { h: 214, s: 34, l: 12 },
            population: 0.2,
            pixelCount: 20,
          },
        ],
      }),
    })
  })
  await page.locator('#source-image').setInputFiles({
    name: 'fixture-palette.png',
    mimeType: 'image/png',
    buffer: png,
  })
  await expect(page.getByRole('button', { name: /^Extracting/ })).toBeVisible()
  await capture(page, '03-extraction-progress')
  await expect(page.getByText(/3 distinct colors were/)).toBeVisible()
  await capture(page, '04-image-palette-workspace')
  await page.locator('[aria-label="Palette color 2"]').click()
  await capture(page, '05-selected-palette-color')

  await page.getByRole('button', { name: 'New palette' }).click()
  await page.getByRole('button', { name: 'Discard and start new' }).click()
  await setPalette(page)
  await capture(page, '06-manual-palette-workspace')
  await page.getByRole('button', { name: 'Save palette' }).click()
  await expect(page.getByText('Saved', { exact: true })).toBeVisible()
  const firstColor = page.getByRole('textbox', {
    name: 'Color 1',
    exact: true,
  })
  await firstColor.fill('#725FD6')
  await firstColor.blur()
  await capture(page, '07-modified-state')
  await page.getByRole('button', { name: 'Save changes' }).click()

  await page.getByRole('button', { name: 'Analyze palette' }).click()
  await expect(page.getByText('Palette summary')).toBeVisible()
  await page.locator('.sidebar-theme select').selectOption('dark')
  await capture(page, '08-review-overview')
  await page.getByRole('tab', { name: 'Harmony' }).click()
  await capture(page, '09-review-harmony')
  await page.getByRole('tab', { name: 'Contrast' }).click()
  await page.getByLabel('Page background').selectOption('#F5F0E8')
  await page.getByLabel('Surface').selectOption('#F5F0E8')
  await page.getByLabel('Primary text').selectOption('#141D29')
  await page.getByLabel('Secondary text').selectOption('#725FD6')
  await page.getByLabel('Primary action').selectOption('#725FD6')
  await page.getByLabel('Action text').selectOption('#F5F0E8')
  await page.getByLabel('Border').selectOption('#725FD6')
  await page.getByLabel('Focus indicator').selectOption('#F2763F')
  await capture(page, '10-contrast-roles')
  await page.getByRole('tab', { name: 'Suggestions' }).click()
  await page.getByRole('button', { name: 'Generate suggestions' }).click()
  await expect(page.locator('.compact-suggestion-list')).toBeVisible()
  await page.getByRole('button', { name: 'Explore all relationships' }).click()
  await expect(page.getByText('Common associations').first()).toBeVisible()
  await capture(page, '11-suggestions')

  await page
    .getByRole('navigation', { name: 'Primary' })
    .getByRole('button', { name: 'Export' })
    .click()
  await capture(page, '12-export')
  await page
    .getByRole('navigation', { name: 'Primary' })
    .getByRole('button', { name: 'Library' })
    .click()
  await capture(page, '13-library')

  await page.setViewportSize({ width: 390, height: 844 })
  await page
    .getByRole('navigation', { name: 'Mobile primary' })
    .getByRole('button', { name: 'Create' })
    .click()
  await capture(page, '14-mobile-create')
  await page
    .getByRole('navigation', { name: 'Mobile primary' })
    .getByRole('button', { name: 'Review' })
    .click()
  await capture(page, '15-mobile-review')

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.getByRole('button', { name: 'New palette' }).click()
  const discardButton = page.getByRole('button', {
    name: 'Discard and start new',
  })
  if (await discardButton.isVisible()) {
    await discardButton.click()
  }
  await page.unroute('**/api/extract-colors?*')
  await page.route('**/api/extract-colors?*', (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({
        error: { code: 'fixture_error', message: 'Fixture extraction failed.' },
      }),
    }),
  )
  await page.locator('#source-image').setInputFiles({
    name: 'fixture-error.png',
    mimeType: 'image/png',
    buffer: png,
  })
  await expect(page.getByRole('alert')).toContainText(
    'Fixture extraction failed.',
  )
  await capture(page, '16-error-notice')
})
