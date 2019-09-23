import flatten from 'lodash/flatten'
import uniq from 'lodash/uniq'
import { getNewOrderForm } from './orderForm'

const getShippingData = (
  address: AddressInput,
  logisticsInfo: LogisticsInfo[]
) => {
  const selectedAddresses = [address]
  const hasGeocoordinates =
    address && address.geoCoordinates && address.geoCoordinates.length > 0
  const logisticsInfoWithAddress = logisticsInfo.map((li: LogisticsInfo) => ({
    ...li,
    addressId: address.addressId,
  }))

  const requestPayload = {
    logisticsInfo: logisticsInfoWithAddress,
    selectedAddresses,
    ...(hasGeocoordinates ? { clearAddressIfPostalCodeNotFound: false } : {}),
  }

  return requestPayload
}

export const getShippingInfo = (orderForm: CheckoutOrderForm) => {
  const logisticsInfo =
    orderForm.shippingData && orderForm.shippingData.logisticsInfo

  const countries = uniq(
    flatten(logisticsInfo ? logisticsInfo.map(item => item.shipsTo) : [])
  )

  const selectedAddresses =
    (orderForm.shippingData && orderForm.shippingData.selectedAddresses) || []

  const deliveryOptions = uniq(
    flatten(logisticsInfo ? logisticsInfo.map(item => item.slas) : [])
  )

  // Since at this time Shipping does not show Pickup Points or
  // Scheduled Delivery/Pickup Options we are filtering from results.
  // Also we will filter deliveryOptions which does not apply to all LogisticsInfo
  const filteredDeliveryOptions = deliveryOptions.filter(
    (deliveryOption: SLA) => {
      const deliveryOptionIsInEveryLogisticsInfo =
        logisticsInfo.length > 0 &&
        logisticsInfo.every((li: LogisticsInfo) =>
          li.slas.some(sla => sla.id === deliveryOption.id)
        )

      return (
        deliveryOption.deliveryChannel === 'delivery' &&
        deliveryOption.availableDeliveryWindows.length === 0 &&
        deliveryOptionIsInEveryLogisticsInfo
      )
    }
  )

  const updatedDeliveryOptions = filteredDeliveryOptions.map(sla => {
    let price = 0

    const isSelected = logisticsInfo.some(li => li.selectedSla === sla.id)
    logisticsInfo.forEach((li: LogisticsInfo) => {
      const currentSla = li.slas.find(liSla => liSla.id === sla.id)

      if (currentSla) {
        price += currentSla.price
      }
    })

    return {
      estimate: sla.shippingEstimate,
      id: sla.id,
      isSelected,
      price,
    }
  })

  return {
    countries,
    deliveryOptions: updatedDeliveryOptions,
    selectedAddresses,
  }
}

export const mutations = {
  estimateShipping: async (
    _: any,
    { address }: { address: AddressInput },
    ctx: Context
  ) => {
    const {
      clients: { checkout, shipping, searchGraphQL },
      vtex: { orderFormId },
    } = ctx

    const orderForm = await checkout.orderForm()
    const logisticsInfo =
      orderForm.shippingData && orderForm.shippingData.logisticsInfo
    const shippingData = getShippingData(address, logisticsInfo)

    const newOrderForm = await shipping.estimateShipping(
      orderFormId!,
      shippingData
    )

    return getNewOrderForm({
      checkout,
      newOrderForm,
      searchGraphQL,
    })
  },
}
