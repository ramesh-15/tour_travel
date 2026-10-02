import { useId } from "react";

export const PAYMENT_TERMS_VERSION = "2026-09-19";

const terms = [
  ["Payment Gateway", "Online payments on Nomad Wanderers are processed through Razorpay, subject to availability and the payment methods enabled for the merchant account. Available methods may include UPI, credit cards, debit cards, net banking, wallets and other methods supported by Razorpay. Nomad Wanderers does not directly store complete card numbers, CVV details, UPI PINs, internet-banking passwords or other sensitive payment authentication credentials."],
  ["Booking Confirmation", "A booking is considered confirmed only after the required payment is successfully completed, Nomad Wanderers receives successful payment confirmation, and a booking confirmation is issued to the customer. Initiating a payment alone does not guarantee a booking. If payment is successful but no booking confirmation is received, the customer should contact Nomad Wanderers with the booking reference and payment transaction details."],
  ["Prices, Taxes and Charges", "All applicable tour or package prices will be displayed or communicated before payment. The final amount may include the tour/package price, applicable taxes, selected add-on services and other charges disclosed before payment. The amount shown at final checkout is the amount payable for that booking."],
  ["Advance and Partial Payments", "For selected tours, custom journeys, group bookings or packages, Nomad Wanderers may permit advance or partial payment. The required advance and the deadline for the remaining balance will be communicated before or at the time of booking. Failure to pay the balance by the due date may result in cancellation, subject to the applicable cancellation and refund policy."],
  ["Failed or Pending Transactions", "A payment may fail or remain pending due to network issues, bank systems, payment gateway issues, incorrect information or other technical reasons. If an amount is debited but the transaction is shown as failed or pending, customers should avoid repeated payments until the status is verified. Any applicable reversal is subject to the processing rules and timelines of the bank, payment provider and Razorpay."],
  ["Duplicate Payments", "If a customer is charged more than once for the same booking, they should contact Nomad Wanderers with the Booking ID, customer name, registered contact details, payment or transaction reference and amount paid. After verification, a confirmed duplicate payment will be eligible for refund to the original payment method."],
  ["Cancellation by Customer", "Cancellation requests must be submitted through an available cancellation facility or through official Nomad Wanderers support channels. Unless a specific tour or package states different terms, cancellation eligibility may depend on the number of days remaining before departure. Special tours, festival tours, hotels, transport, permits, tickets and third-party activities may have separate or non-refundable conditions. Any specific cancellation percentage, fee or refund amount shown on the tour/package page or booking confirmation will apply to that booking."],
  ["Cancellation or Rescheduling by Nomad Wanderers", "Nomad Wanderers may cancel or reschedule a tour because of unsafe weather, government restrictions, natural disasters, insufficient participation, operational or guide unavailability, transport disruption, safety concerns or other circumstances beyond reasonable control. If Nomad Wanderers cancels a service and cannot provide a suitable alternative, the customer may be offered rescheduling, travel credit or a refund, depending on the circumstances and any non-refundable third-party costs already incurred."],
  ["Refunds and Partial Refunds", "Approved refunds will normally be initiated through the payment system and returned to the original payment method used for the transaction. Refund processing and credit timelines depend on Razorpay, the customer's bank, card issuer, UPI provider or other financial institution. Applicable cancellation charges, non-refundable third-party costs or other disclosed deductions may be deducted from the refundable amount. Where applicable, Nomad Wanderers may issue a partial rather than a full refund, based on cancellation timing, services already supplied, supplier charges and other costs already incurred."],
  ["Non-Refundable Items", "Certain costs may be non-refundable, including non-refundable hotel reservations, flight/train/transport tickets, entry or event tickets, permits, visa-related costs, special customer-specific arrangements, third-party charges and services already consumed. Material non-refundable conditions should be disclosed before or at booking wherever reasonably possible."],
  ["Booking and Tour Changes", "Customer-requested changes to travel dates, destinations, traveller count, accommodation, transportation, activities or other booking details are subject to availability. Additional fare differences, supplier amendment fees or other costs caused by the requested change may be payable by the customer."],
  ["Payment Disputes and Chargebacks", "Customers should first contact Nomad Wanderers if they believe a payment is incorrect or if they have a dispute regarding a booking. If a chargeback or payment dispute is raised, Nomad Wanderers may provide relevant booking, payment, invoice, cancellation, communication and service-fulfilment records to Razorpay, banks, card networks or other parties handling the dispute, subject to applicable law."],
  ["Promotional Codes and Discounts", "Coupons, promotional codes and special offers may have validity dates, tour restrictions, minimum booking values or other conditions and generally cannot be exchanged for cash. If a discounted booking is eligible for a refund, the refund will normally be based on the amount actually paid, subject to the applicable cancellation policy."],
  ["Currency", "Unless otherwise stated, bookings in India are displayed and processed in Indian Rupees (INR). International customers may incur currency-conversion or foreign-transaction fees charged independently by their bank, card issuer or payment provider. Such external charges are not controlled by Nomad Wanderers."],
  ["Payment Security", "Customers are responsible for entering accurate payment information and ensuring they are authorized to use the selected payment method. Nomad Wanderers will not ask customers to disclose a UPI PIN, card PIN, internet-banking password or OTP for an unauthorized transaction. Customers should report suspicious payment requests claiming to represent Nomad Wanderers."],
  ["Third-Party Payment Services", "Razorpay operates as a third-party payment service provider. Payment processing may also be subject to Razorpay's terms, policies, technical availability, banking-partner requirements and applicable regulations. Nomad Wanderers is not responsible for delays or failures caused solely by banks, card networks, UPI infrastructure, telecommunications providers, Razorpay or other third-party payment infrastructure, although reasonable assistance may be provided."],
  ["Customer Responsibility", "Before payment, customers should verify the tour/package name, travel date, traveller count, traveller details, pickup information where applicable, total amount and cancellation/refund conditions. Booking errors caused by incorrect customer-submitted information may be subject to amendment charges or availability limitations, except where applicable law provides otherwise."],
  ["Refund Requests", "Customers requesting cancellation or refund should use the official Nomad Wanderers support contact displayed on the website/application. The request should include the Booking ID, customer name, registered email/mobile number, payment or transaction reference and the reason for the request. Eligibility will be determined under the policy applicable to the booking."],
  ["Changes to These Terms", "Nomad Wanderers may update these Payment Terms & Conditions to reflect changes in services, payment processes, business requirements or applicable law. Unless otherwise required by law, the terms applicable to a booking will generally be those made available when the booking/payment was completed."],
  ["Acceptance", "By selecting the checkout acknowledgement and proceeding with payment, the customer confirms acceptance of the applicable Payment Terms & Conditions, including the cancellation and refund terms."],
];

export function PaymentTermsAcceptance({ accepted, onChange, disabled = false }) {
  const checkboxId = useId();

  return (
    <div className="payment-terms-consent">
      <details className="payment-terms-details">
        <summary>Read Payment Terms &amp; Conditions</summary>
        <div className="payment-terms-content">
          <p>
            These Payment Terms &amp; Conditions govern bookings and payments made
            to Nomad Wanderers. Online payments may be processed through
            Razorpay, a third-party payment gateway. Customers should review the
            booking details, price, travel date and cancellation terms before
            completing payment.
          </p>
          <ol>
            {terms.map(([heading, text]) => (
              <li key={heading}>
                <b>{heading}</b>
                <p>{text}</p>
              </li>
            ))}
          </ol>
          <p>
            <b>Contact &amp; Support:</b> For booking, payment, cancellation or
            refund assistance, use the official contact information published on
            the Nomad Wanderers website or application.
          </p>
        </div>
      </details>
      <label className="payment-terms-checkbox" htmlFor={checkboxId}>
        <input
          id={checkboxId}
          type="checkbox"
          checked={accepted}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span>
          I have read and agree to the Payment Terms &amp; Conditions, including
          the cancellation and refund terms.
        </span>
      </label>
      {!accepted && <small>Acceptance is required before secure payment.</small>}
    </div>
  );
}
