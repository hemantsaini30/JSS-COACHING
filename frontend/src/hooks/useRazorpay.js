const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

const useRazorpay = () => {
  const openCheckout = async ({ orderId, amount, keyId, studentName, period, onSuccess, onFailure }) => {
    const loaded = await loadRazorpayScript()
    if (!loaded) {
      onFailure?.('Failed to load Razorpay. Check your internet connection.')
      return
    }

    const options = {
      key: keyId,
      amount,
      currency: 'INR',
      name: 'Instora',
      description: `Fee payment${period ? ` — ${period}` : ''}`,
      order_id: orderId,
      handler: (response) => {
        onSuccess?.({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        })
      },
      prefill: { name: studentName || '' },
      theme: { color: '#7C3AED' },
      modal: {
        ondismiss: () => onFailure?.('Payment cancelled'),
      },
    }

    const rzp = new window.Razorpay(options)
    rzp.on('payment.failed', (response) => {
      onFailure?.(response.error?.description || 'Payment failed')
    })
    rzp.open()
  }

  return { openCheckout }
}

export default useRazorpay