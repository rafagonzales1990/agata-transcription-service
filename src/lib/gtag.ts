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

// --- GTM dataLayer events ---
export const pushEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && (window as any).dataLayer) {
    ;(window as any).dataLayer.push({
      event: eventName,
      ...params,
    })
  }
}

export const trackSignup = () => pushEvent('signup_completed')

export const trackBeginCheckout = (planName: string, value: number) =>
  pushEvent('begin_checkout', { plan_name: planName, value, currency: 'BRL' })

export const trackPurchase = (planName: string, value: number) =>
  pushEvent('purchase_completed', { plan_name: planName, value, currency: 'BRL' })

export const trackFirstTranscription = () =>
  pushEvent('first_transcription')

export const trackUploadStarted = () =>
  pushEvent('upload_started')

// --- Demo Funnel events ---
interface DemoEventParams {
  source?: string
  campaign?: string
  medium?: string
  persona?: string
  leadId?: string
  meetingId?: string
}

export const demoLandingView = (params?: DemoEventParams) => {
  gtag('event', 'demo_landing_view', params)
  pushEvent('demo_landing_view', params)
}

export const demoLeadCreated = (params?: DemoEventParams) => {
  gtag('event', 'demo_lead_created', params)
  pushEvent('demo_lead_created', params)
}

export const demoStarted = (params?: DemoEventParams) => {
  gtag('event', 'demo_started', params)
  pushEvent('demo_started', params)
}

export const demoCompleted = (params?: DemoEventParams) => {
  gtag('event', 'demo_completed', params)
  pushEvent('demo_completed', params)
}

export const demoSignupClick = (params?: DemoEventParams) => {
  gtag('event', 'demo_signup_click', params)
  pushEvent('demo_signup_click', params)
}

export const trialStartedFromDemo = (params?: DemoEventParams) => {
  gtag('event', 'trial_started_from_demo', params)
  pushEvent('trial_started_from_demo', params)
}

export const demoBeginCheckout = (params?: DemoEventParams) => {
  gtag('event', 'demo_begin_checkout', params)
  pushEvent('demo_begin_checkout', params)
}

export const paidFromDemo = (params?: DemoEventParams) => {
  gtag('event', 'paid_from_demo', params)
  pushEvent('paid_from_demo', params)
}
