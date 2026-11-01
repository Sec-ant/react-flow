import { expect, test } from '@playwright/test';

import { FRAMEWORK } from './constants';

test.describe('useUpdateNodeInternals', () => {
  test.skip(FRAMEWORK !== 'react', 'React hook regression tests');

  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/generic/nodes/internals-updates');
    await expect(page.locator('.react-flow__node[data-id="a"]')).toHaveCSS('visibility', 'visible');
    await page.evaluate(
      () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
    );
  });

  test('measures each node once per frame across hook instances', async ({ page }) => {
    await page.locator('.react-flow__node').evaluateAll((nodes) => {
      for (const node of nodes) {
        const readBounds = node.getBoundingClientRect.bind(node);
        node.setAttribute('data-bounds-reads', '0');
        node.getBoundingClientRect = () => {
          node.setAttribute('data-bounds-reads', String(Number(node.getAttribute('data-bounds-reads')) + 1));
          return readBounds();
        };
      }
    });
    await page.getByRole('button', { name: 'Measure nodes repeatedly' }).click();
    await expect(page.locator('.react-flow__node[data-id="a"]')).toHaveAttribute('data-bounds-reads', '1');
    await expect(page.locator('.react-flow__node[data-id="b"]')).toHaveAttribute('data-bounds-reads', '1');
    await page.getByRole('button', { name: 'Measure nodes repeatedly' }).click();
    await expect(page.locator('.react-flow__node[data-id="a"]')).toHaveAttribute('data-bounds-reads', '2');
    await expect(page.locator('.react-flow__node[data-id="b"]')).toHaveAttribute('data-bounds-reads', '2');
  });

  test('measures handles added in the same event after React commits', async ({ page }) => {
    await expect(page.locator('.react-flow__edge')).toHaveCount(0);
    await page.getByRole('button', { name: 'Add handle and measure' }).click();
    await expect(page.locator('.react-flow__handle[data-handleid="dynamic"]')).toBeVisible();
    await expect(page.locator('.react-flow__edge')).toHaveCount(1);
  });

  test('ignores nodes removed before the measurement frame', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.getByRole('button', { name: 'Remove queued node' }).click();
    await expect(page.locator('.react-flow__node[data-id="a"]')).toHaveCount(0);
    await page.evaluate(
      () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
    );
    expect(errors).toEqual([]);
  });
});
