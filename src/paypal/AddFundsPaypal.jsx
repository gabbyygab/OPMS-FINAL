import { useEffect, useRef } from "react";

export default function AddFundsPaypal({ amount, onSuccess, isLoading }) {
  const paypalRef = useRef();

  useEffect(() => {
    if (!window.paypal || !amount) return;

    window.paypal
      .Buttons({
        style: {
          layout: "vertical",
          color: "gold",
          shape: "pill",
          label: "paypal",
        },
        createOrder: (data, actions) => {
          return actions.order.create({
            purchase_units: [
              {
                amount: {
                  value: amount.toString(),
                },
              },
            ],
          });
        },
        onApprove: async (data, actions) => {
          const details = await actions.order.capture();
          const paidAmount = details.purchase_units[0].amount.value || amount;

          // Notify parent component (WalletPage)
          onSuccess(parseFloat(paidAmount));
        },
        onError: (err) => {
          console.error("PayPal Error:", err);
          alert("Something went wrong with PayPal.");
        },
      })
      .render(paypalRef.current);
  }, [amount]);

  return <div ref={paypalRef}></div>;
}
