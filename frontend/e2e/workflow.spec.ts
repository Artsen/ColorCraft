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

test('representative Create, Review, and Library states have no serious axe violations', async ({
  page,
}) => {
  await createManualPalette(page)
  for (const destination of ['create', 'review', 'library'] as const) {
    if (destination === 'review') {
      await page.getByRole('button', { name: 'Analyze palette' }).click()
      await expect(page.getByText('Palette summary')).toBeVisible()
    } else {
      await page
        .getByRole('navigation', { name: 'Primary' })
        .getByRole('button', {
          name: destination === 'create' ? 'Create' : 'Library',
        })
        .click()
    }
    const results = await new AxeBuilder({ page }).analyze()
    const serious = results.violations.filter((violation) =>
      ['serious', 'critical'].includes(violation.impact ?? ''),
    )
    expect(serious).toEqual([])
  }
})
