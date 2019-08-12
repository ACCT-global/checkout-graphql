import { map } from 'bluebird'
import { find } from 'ramda'

import { StoreGraphQL } from '../clients/storeGraphQL'
import { fixImageUrl } from '../utils/image'

const getSkuSpecifications = (skuId: string, skuList: any[]) => {
  const matchedSku = find((sku: any) => sku.itemId === skuId, skuList)
  if (!matchedSku) {
    return []
  }
  return matchedSku.skuSpecifications
}

const adjustItems = (items: OrderFormItem[], storeGraphQL: StoreGraphQL) =>
  map(items, async (item: OrderFormItem) => {
    const response = await storeGraphQL.product({
      identifier: {
        field: 'id',
        value: item.productId,
      },
    })

    const { product } = response.data!

    return {
      ...item,
      imageUrl: fixImageUrl(item.imageUrl),
      name: product.productName,
      skuSpecifications: getSkuSpecifications(item.id, product.items),
    }
  })


export const queries = {
  cart: async (_: any, __: any, ctx: Context) => {
    const { clients: { checkout, storeGraphQL } } = ctx
    const { items, storePreferencesData } = await checkout.orderForm()

    const adjustedItems = await adjustItems(items, storeGraphQL)

    return {
      items: adjustedItems,
      storePreferencesData,
    }
  },
}

export const mutations = {
  updateItems: async (_: any, { orderItems }: { orderItems: OrderFormItemInput[] }, ctx: Context) => {
    const { clients: { checkout, storeGraphQL }, vtex: { orderFormId } } = ctx
    const orderForm = await checkout.updateItems(orderFormId!, orderItems)

    const adjustedItems = await adjustItems(orderForm.items, storeGraphQL)

    return {
      items: adjustedItems,
    }
  },
}
