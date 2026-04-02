export const GA_MEASUREMENT_ID = 'G-894VH59E2B'
export const GADS_ID = 'AW-18025824567'

export const gtag = (...args: any[]) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    ;(window as any).gtag(...args)
  }
}

export const pageview = (url: string) => {
  gtag('config', GA_MEASUREMENT_ID, { page_path: url })
}

export const conversionSignup = () => {
  gtag('event', 'conversion', {
    send_to: `${GADS_ID}/signup`,
    value: 0,
    currency: 'BRL',
  })
  gtag('event', 'sign_up', { method: 'email' })
}

export const conversionPurchase = (planName: string, value: number) => {
  gtag('event', 'conversion', {
    send_to: `${GADS_ID}/purchase`,
    value: value,
    currency: 'BRL',
    transaction_id: Date.now().toString(),
  })
  gtag('event', 'purchase', {
    currency: 'BRL',
    value: value,
    items: [{ item_name: planName }],
  })
}

export const conversionBeginCheckout = (planName: string, value: number) => {
  gtag('event', 'begin_checkout', {
    currency: 'BRL',
    value: value,
    items: [{ item_name: planName }],
  })
}

export const eventFirstTranscription = () => {
  gtag('event', 'first_transcription', {
    event_category: 'engagement',
  })
}
