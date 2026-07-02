import { test, expect } from '@playwright/test'

/**
 * Inventory CRUD E2E Tests
 * - Ročni vnos novega artikla
 * - Posodobitev artikla
 * - Brisanje (soft + hard)
 * - Preprečevanje duplikatov
 */

const TEST_ITEM = {
  name: 'Test Artikel E2E',
  category: 'Predjedi',
  subcategory: 'Test',
  unit: 'kos',
  purchasePrice: 5.0,
  salePrice: 8.0,
  stock: 10,
  minStock: 2,
  supplier: 'Test Supplier',
  description: 'Za testiranje',
}

test.describe('Inventory CRUD', () => {
  let testItemId: string

  test('POST — ročni vnos novega artikla', async ({ request }) => {
    const response = await request.post('/api/inventory/items', {
      data: TEST_ITEM,
    })
    expect(response.status()).toBe(201)

    const data = await response.json()
    expect(data.ok).toBe(true)
    expect(data.item.name).toBe(TEST_ITEM.name)
    expect(data.item.category).toBe(TEST_ITEM.category)
    expect(data.item.stock).toBe(TEST_ITEM.stock)
    expect(data.item.unit).toBe(TEST_ITEM.unit)

    testItemId = data.item.id
  })

  test('POST — prepreči duplikat', async ({ request }) => {
    const response = await request.post('/api/inventory/items', {
      data: { name: 'Pizza Margherita', category: 'Pice' },
    })
    expect(response.status()).toBe(409)

    const data = await response.json()
    expect(data.ok).toBe(false)
    expect(data.error).toContain('že obstaja')
  })

  test('POST — validacija obveznih polj', async ({ request }) => {
    // Brez imena
    const res1 = await request.post('/api/inventory/items', {
      data: { category: 'Test' },
    })
    expect(res1.status()).toBe(400)

    // Brez kategorije
    const res2 = await request.post('/api/inventory/items', {
      data: { name: 'Test' },
    })
    expect(res2.status()).toBe(400)
  })

  test('GET — vrne vse artikle', async ({ request }) => {
    const response = await request.get('/api/inventory/items')
    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data.items).toBeDefined()
    expect(data.total).toBeGreaterThan(0)
    expect(Array.isArray(data.items)).toBe(true)
  })

  test('GET — filter po kategoriji', async ({ request }) => {
    const response = await request.get('/api/inventory/items?category=Pice')
    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data.items.length).toBeGreaterThan(0)
    // Vsi artikli morajo biti v kategoriji Pice
    for (const item of data.items) {
      expect(item.category).toBe('Pice')
    }
  })

  test('GET — iskanje po imenu', async ({ request }) => {
    const response = await request.get('/api/inventory/items?search=Pizza')
    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data.items.length).toBeGreaterThan(0)
    // Vsi rezultati morajo vsebovati "Pizza"
    for (const item of data.items) {
      expect(item.name.toLowerCase()).toContain('pizza')
    }
  })

  test('GET — low stock filter', async ({ request }) => {
    const response = await request.get('/api/inventory/items?lowStock=true')
    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data.items.length).toBeGreaterThan(0)
    // Vsi morajo imeti stock <= 0
    for (const item of data.items) {
      expect(item.stock).toBeLessThanOrEqual(0)
    }
  })

  test('PUT — posodobi artikel', async ({ request }) => {
    // Najprej ustvari test artikel
    const createRes = await request.post('/api/inventory/items', {
      data: { name: 'Test PUT Artikel', category: 'Test', unit: 'kos' },
    })
    const created = await createRes.json()
    const id = created.item.id

    // Posodobi
    const updateRes = await request.put(`/api/inventory/items/${id}`, {
      data: { stock: 15, salePrice: 12.5, description: 'Posodobljeno' },
    })
    expect(updateRes.status()).toBe(200)

    const updated = await updateRes.json()
    expect(updated.ok).toBe(true)
    expect(updated.item.stock).toBe(15)
    expect(updated.item.salePrice).toBe(12.5)
    expect(updated.item.description).toBe('Posodobljeno')

    // Cleanup
    await request.delete(`/api/inventory/items/${id}?hard=true`)
  })

  test('DELETE — soft delete (deaktiviraj)', async ({ request }) => {
    const createRes = await request.post('/api/inventory/items', {
      data: { name: 'Test Soft Delete', category: 'Test', unit: 'kos' },
    })
    const id = (await createRes.json()).item.id

    const delRes = await request.delete(`/api/inventory/items/${id}`)
    expect(delRes.status()).toBe(200)

    const data = await delRes.json()
    expect(data.ok).toBe(true)
    expect(data.item.active).toBe(false)

    // Cleanup
    await request.delete(`/api/inventory/items/${id}?hard=true`)
  })

  test('DELETE — hard delete (trajno)', async ({ request }) => {
    const createRes = await request.post('/api/inventory/items', {
      data: { name: 'Test Hard Delete', category: 'Test', unit: 'kos' },
    })
    const id = (await createRes.json()).item.id

    const delRes = await request.delete(`/api/inventory/items/${id}?hard=true`)
    expect(delRes.status()).toBe(200)

    const data = await delRes.json()
    expect(data.ok).toBe(true)
    expect(data.deleted).toBe(true)

    // Preveri da ni več v bazi
    const getRes = await request.get(`/api/inventory/items/${id}`)
    expect(getRes.status()).toBe(404)
  })

  test('GET /api/inventory/seed — statistika', async ({ request }) => {
    const response = await request.get('/api/inventory/seed')
    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data.totalItems).toBeGreaterThan(200)
    expect(data.byCategory).toBeDefined()
    expect(Object.keys(data.byCategory).length).toBeGreaterThan(15)
  })

  test('POST /api/inventory/delivery — vnos dobavnice', async ({ request }) => {
    const response = await request.post('/api/inventory/delivery', {
      data: {
        deliveries: [
          { itemName: 'Pizza Margherita', quantity: 5 },
        ],
      },
    })
    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data.ok).toBe(true)
    expect(data.successCount).toBe(1)
    expect(data.results[0].newStock).toBeGreaterThanOrEqual(5)
  })
})
