export interface ProductResponse {
  product: {
    productName: string
    items: Array<{
      name: string
      variations: Array<{
        name: string
        values: string[]
      }>
    }>
  }
}

export interface ProductArgs {
  identifier: ProductUniqueIdentifier
}

interface ProductUniqueIdentifier {
  field: 'id' | 'slug' | 'ean' | 'reference' | 'sku'
  value: string
}

export const query = `
query Product($identifier: ProductUniqueIdentifier) {
  product(identifier: $identifier) {
    productName
    items {
      name
      variations {
        name
        values
      }
    }
  }
}
`
