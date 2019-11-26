import { mutations as couponMutations } from './coupon'
import { mutations as itemMutations } from './items'
import { queries as orderFormQueries } from './orderForm'
import { Address, mutations as shippingMutations } from './shipping/index'

export const resolvers = {
  Address,
  MarketingData: {
    coupon: (marketingData: OrderFormMarketingData) => {
      return marketingData.coupon || ''
    },
  },
  Mutation: {
    ...couponMutations,
    ...itemMutations,
    ...shippingMutations,
  },
  OrderForm: {
    marketingData: (orderForm: OrderForm) => {
      return orderForm.marketingData || {}
    },
  },
  Query: {
    ...orderFormQueries,
  },
}
