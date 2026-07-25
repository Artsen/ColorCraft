import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

async function createManualPalette(page: Page) {
  await page.goto('/?view=create')
  await page.getByRole('button', { name: 'Start manually' }).click()
  await page.getByRole('button', { name: 'Add color' }).click()
  await page
    .getByRole('textbox', { name: 'Color 1', exact: true })
    .fill('#6A5BCF')
  await page.getByRole('textbox', { name: 'Color 1', exact: true }).blur()
  await page
    .getByRole('textbox', { name: 'Color 2', exact: true })
    .fill('#F5F0E8')
  await page.getByRole('textbox', { name: 'Color 2', exact: true }).blur()
}

test('creation through save, review, export, reopen, and delete', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await createManualPalette(page)
  await expect(page.getByText('Unsaved')).toBeVisible()
  await page.getByRole('button', { name: 'Save palette' }).click()
  await expect(page.getByText('Saved', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Analyze palette' }).click()
  await expect(page.getByText('Palette summary')).toBeVisible()
  await page.getByRole('tab', { name: 'Contrast' }).click()
  await page.getByLabel('Page background').selectOption('#F5F0E8')
  await page.getByLabel('Primary text').selectOption('#6A5BCF')
  await expect(page.getByText('Primary text on page background')).toBeVisible()
  await expect(page.getByText(/AA normal text/).first()).toBeVisible()

  await page
    .getByRole('navigation', { name: 'Primary' })
    .getByRole('button', { name: 'Export' })
    .click()
  await expect(
    page.getByLabel(/Generated CSS custom properties preview/),
  ).toContainText('--color-palette-1')
  await page.getByRole('button', { name: 'Copy' }).click()
  await expect(page.getByText(/copied to the clipboard/)).toBeVisible()

  await page
    .getByRole('navigation', { name: 'Primary' })
    .getByRole('button', { name: 'Library' })
    .click()
  await expect(
    page.getByRole('button', { name: 'Open Untitled palette' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Open Untitled palette' }).click()
  await expect(page.locator('input[value="#6A5BCF"]').first()).toBeVisible()

  await page
    .getByRole('navigation', { name: 'Primary' })
    .getByRole('button', { name: 'Library' })
    .click()
  await page.getByRole('button', { name: 'Delete Untitled palette' }).click()
  await page.getByRole('button', { name: 'Delete palette' }).click()
  await expect(page.getByText('No saved palettes')).toBeVisible()
})

test('trust-sensitive Create, Review, Suggestions, and Export states are explicit', async ({
  page,
}) => {
  await page.goto('/?view=create')
  await expect(page.getByText('JPG, PNG, or WebP · up to 10 MB')).toBeVisible()
  await expect(page.getByText('Loopback only')).toHaveAccessibleDescription(
    /loopback traffic only/i,
  )

  await createManualPalette(page)
  await page
    .getByRole('textbox', { name: 'Color 1', exact: true })
    .fill('#141D29')
  await page.getByRole('textbox', { name: 'Color 1', exact: true }).blur()
  await page.getByRole('button', { name: 'Add color' }).click()
  await page
    .getByRole('textbox', { name: 'Color 3', exact: true })
    .fill('#80FF00')
  await page.getByRole('textbox', { name: 'Color 3', exact: true }).blur()
  await page.getByRole('button', { name: 'Analyze palette' }).click()
  await expect(page.getByText(/transitional/)).toBeVisible()

  await page.getByRole('tab', { name: 'Contrast' }).click()
  await page.getByLabel('Page background').selectOption('#F5F0E8')
  await page.getByLabel('Surface').selectOption('#F5F0E8')
  await page.getByLabel('Primary text', { exact: true }).selectOption('#141D29')
  await page.getByLabel('Border').selectOption('#141D29')
  await page.getByLabel('Focus indicator').selectOption('#80FF00')
  await expect(page.getByText(/AA normal text/).first()).toBeVisible()
  await expect(page.getByText(/Non-text component contrast/)).toBeVisible()
  await expect(
    page.getByText(/Focus-indicator color contrast/).first(),
  ).toBeVisible()
  await expect(page.getByText(/Size, area, thickness/).first()).toBeVisible()

  for (const tab of ['Contrast', 'Suggestions'] as const) {
    await page.getByRole('tab', { name: tab }).click()
    if (tab === 'Suggestions') {
      await expect(
        page.getByText(/do not measure palette quality/i),
      ).toBeVisible()
      await page.getByRole('button', { name: 'Generate suggestions' }).click()
      await page
        .getByRole('button', { name: 'Explore all relationships' })
        .click()
      await expect(page.getByText('Common associations').first()).toBeVisible()
    }
    const results = await new AxeBuilder({ page }).analyze()
    const serious = results.violations.filter((violation) =>
      ['serious', 'critical'].includes(violation.impact ?? ''),
    )
    expect(serious).toEqual([])
  }

  await page
    .getByRole('navigation', { name: 'Primary' })
    .getByRole('button', { name: 'Export' })
    .click()
  await page.getByRole('tab', { name: 'SVG swatch sheet' }).click()
  await expect(
    page.getByLabel(/Generated SVG swatch sheet preview/),
  ).toContainText('fill="#')
})

test('representative Create and Library states have no serious axe violations', async ({
  page,
}) => {
  await createManualPalette(page)
  for (const destination of ['create', 'library'] as const) {
    await page
      .getByRole('navigation', { name: 'Primary' })
      .getByRole('button', {
        name: destination === 'create' ? 'Create' : 'Library',
      })
      .click()
    const results = await new AxeBuilder({ page }).analyze()
    const serious = results.violations.filter((violation) =>
      ['serious', 'critical'].includes(violation.impact ?? ''),
    )
    expect(serious).toEqual([])
  }
})

test('portable JSON round trip preserves names, order, roles, and local save lifecycle', async ({
  page,
}) => {
  await createManualPalette(page)
  await page.getByRole('button', { name: 'Add color' }).click()
  await page
    .getByRole('textbox', { name: 'Color 3', exact: true })
    .fill('#141D29')
  await page.getByRole('textbox', { name: 'Color 3', exact: true }).blur()
  for (const [index, name] of [
    [1, 'Primary action'],
    [2, 'Surface'],
    [3, 'Primary text'],
  ] as const) {
    await page.getByLabel(`Name for color ${index}`).fill(name)
    await page.getByLabel(`Name for color ${index}`).blur()
  }
  await page.getByRole('button', { name: /Actions for Primary text/ }).click()
  await page.getByRole('menuitem', { name: 'Move up' }).click()
  await expect(page.getByLabel('Name for color 2')).toHaveValue('Primary text')

  await page.getByRole('button', { name: 'Analyze palette' }).click()
  await page.getByRole('tab', { name: 'Contrast' }).click()
  await page.getByLabel('Primary text', { exact: true }).selectOption('#141D29')
  await page.getByRole('button', { name: 'Save palette' }).click()
  await expect(page.getByText('Saved', { exact: true })).toBeVisible()

  await page
    .getByRole('navigation', { name: 'Primary' })
    .getByRole('button', { name: 'Export' })
    .click()
  await page.getByRole('tab', { name: 'JSON' }).click()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download' }).click()
  const download = await downloadPromise
  const downloadPath = await download.path()
  expect(downloadPath).not.toBeNull()

  await page.getByRole('button', { name: 'New palette' }).click()
  await expect(page.getByText('Create a palette')).toBeVisible()
  await page
    .locator('input[accept=".json,application/json"]')
    .setInputFiles(downloadPath!)
  await expect(
    page.getByText(/was imported locally and remains unsaved/),
  ).toBeVisible()
  await expect(page.getByText('Unsaved', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Name for color 1')).toHaveValue(
    'Primary action',
  )
  await expect(page.getByLabel('Name for color 2')).toHaveValue('Primary text')
  await expect(page.getByLabel('Name for color 3')).toHaveValue('Surface')

  await page.getByRole('button', { name: 'Save palette' }).click()
  await page
    .getByRole('navigation', { name: 'Primary' })
    .getByRole('button', { name: 'Library' })
    .click()
  await page
    .getByRole('button', { name: 'Open Untitled palette' })
    .first()
    .click()
  await expect(page.getByLabel('Name for color 2')).toHaveValue('Primary text')
})

test('empty, import error, and imported organization states pass axe', async ({
  page,
}) => {
  await page.goto('/?view=create')
  const assertAxe = async () => {
    const results = await new AxeBuilder({ page }).analyze()
    expect(
      results.violations.filter((violation) =>
        ['serious', 'critical'].includes(violation.impact ?? ''),
      ),
    ).toEqual([])
  }
  await expect(
    page.locator('button', { hasText: 'Import ColorCraft JSON' }),
  ).toBeVisible()
  await assertAxe()

  const input = page.locator('input[accept=".json,application/json"]')
  await input.setInputFiles({
    name: 'invalid.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{'),
  })
  await expect(page.getByRole('alert')).toContainText('valid JSON')
  await assertAxe()

  await input.setInputFiles({
    name: 'palette.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      JSON.stringify({
        schemaVersion: 2,
        format: 'colorcraft-palette',
        paletteName: 'Imported organization',
        colors: [
          {
            order: 1,
            name: 'Primary action',
            hex: '#FF0000',
            rgb: { r: 255, g: 0, b: 0 },
            hsl: { h: 0, s: 100, l: 50 },
            roles: [],
          },
        ],
        roleAssignments: {},
      }),
    ),
  })
  await expect(page.getByLabel('Name for color 1')).toHaveValue(
    'Primary action',
  )
  await assertAxe()
})
