import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { headers } from 'next/headers'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  try {
    const body = await req.text()
    const signature = headers().get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      )
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session
        // Aggiorna il piano dell'utente nel database
        await updateUserSubscription(session)
        break

      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription
        // Aggiorna lo stato dell'abbonamento
        await handleSubscriptionUpdate(subscription)
        break

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription
        // Gestisci la cancellazione dell'abbonamento
        await handleSubscriptionCancellation(deletedSubscription)
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function updateUserSubscription(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string
  
  // Recupera i dettagli dell'abbonamento
  const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
  const priceId = subscription.items.data[0].price.id

  // Mappa gli ID dei prezzi Stripe ai piani
  const planMap = {
    'price_host': 'host',
    'price_manager': 'manager',
    'price_director': 'director'
  }

  const plan = planMap[priceId as keyof typeof planMap] || 'trial'

  // Aggiorna il database
  await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/subscription`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      stripeCustomerId: customerId,
      plan: plan,
      status: 'active'
    })
  })
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const status = subscription.status

  await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/subscription`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      stripeCustomerId: customerId,
      status: status
    })
  })
}

async function handleSubscriptionCancellation(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/subscription`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      stripeCustomerId: customerId,
      status: 'canceled',
      plan: 'trial'
    })
  })
} 
