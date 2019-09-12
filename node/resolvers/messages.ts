const COUPON_EXPIRED = 'couponExpired'
const COUPON_NOT_FOUND = 'couponNotFound'

const COUPON_CODES = [COUPON_EXPIRED, COUPON_NOT_FOUND]

export const fillMessages = ({ messages }: CheckoutOrderForm) => {
  let couponMessages: Message[] = []

  messages.forEach(message => {
    if (COUPON_CODES.includes(message.code)) {
      couponMessages.push(message)
    }
  })

  return { couponMessages }
}
