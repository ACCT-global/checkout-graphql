import { map } from 'bluebird'

import { SearchGraphQL } from '../clients/searchGraphQL'
import { fixImageUrl } from '../utils/image'
import { getNewOrderForm } from './orderForm'

const getVariations = (skuId: string, skuList: any[]) => {
  const matchedSku = skuList.find((sku: any) => sku.itemId === skuId)
  if (!matchedSku) {
    return []
  }
  return matchedSku.variations.map((variation: any) => ({
    fieldName: variation.name,
    fieldValues: variation.values,
  }))
}

export const adjustItems = (
  items: OrderFormItem[],
  searchGraphQL: SearchGraphQL
) =>
  map(items, async (item: OrderFormItem) => {
    const response = await searchGraphQL.product({
      identifier: {
        field: 'id',
        value: item.productId,
      },
    })

    const { product } = response.data!

    return {
      ...item,
      imageUrl: fixImageUrl(item.imageUrl)!,
      name: product.productName,
      skuSpecifications: getVariations(item.id, product.items),
    }
  })

export const mutations = {
  updateItems: async (
    _: any,
    { orderItems }: { orderItems: OrderFormItemInput[] },
    ctx: Context
  ): Promise<OrderForm> => {
    const {
      clients: { checkout, searchGraphQL },
      vtex: { orderFormId },
    } = ctx

    if (orderItems.some((item: OrderFormItemInput) => !item.index)) {
      const orderForm = await checkout.orderForm()

      const idToIndex = orderForm.items.reduce(
        (acc: Record<string, number>, item: OrderFormItem, index: number) => {
          acc[item.uniqueId] = index
          return acc
        },
        {} as Record<string, number>
      )

      orderItems.forEach((item: OrderFormItemInput) => {
        if (!item.index && item.uniqueId) {
          item.index = idToIndex[item.uniqueId]
        }
      })
    }

    const newOrderForm = await checkout.updateItems(orderFormId!, orderItems)

    return getNewOrderForm({
      checkout,
      newOrderForm,
      searchGraphQL,
    })
  },
}
