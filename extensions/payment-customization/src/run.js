// @ts-check

/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 */

const NO_CHANGES = {
  operations: [],
};

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function run(input) {
  const operations = [];
  const totalAmount = parseFloat(input.cart.cost.totalAmount.amount);

  const cod = input.paymentMethods.find(
    (method) =>
      method.__typename === "PaymentCustomizationPaymentMethod" &&
      method.name.toLowerCase().includes("cod")
  );

  const razorPay = input.paymentMethods.find(
    (method) =>
      method.__typename === "PaymentCustomizationPaymentMethod" &&
      method.name.toLowerCase().includes("razorpay")
  );

  const simpl = input.paymentMethods.find(
    (method) =>
      method.__typename === "PaymentCustomizationPaymentMethod" &&
      method.name.toLowerCase().includes("simpl")
  );

  const snapmint = input.paymentMethods.find(
    (method) =>
      method.__typename === "PaymentCustomizationPaymentMethod" &&
      method.name.toLowerCase().includes("snapmint")
  );

  const deliveryAddress = input.cart.deliveryGroups?.[0]?.deliveryAddress;
  const isIndianOrder = deliveryAddress?.countryCode === "IN";

  // Move payment methods
  if (razorPay) operations.push({ move: { paymentMethodId: razorPay.id, index: 0 }});
  if (simpl) operations.push({ move: { paymentMethodId: simpl.id, index: 1 }});
  if (snapmint) operations.push({ move: { paymentMethodId: snapmint.id, index: 2 }});

  const prepaidAttr = input.cart?.prepaid;
  const hasEligibilityData = prepaidAttr?.value !== null && prepaidAttr?.value !== undefined;
  const prepaid = prepaidAttr?.value === "true"; // true = COD allowed

  // COD logic ONLY when eligibility data exists
  if (cod) {
    if (!hasEligibilityData) {
      // Show COD by default
      operations.push({
        move: {
          paymentMethodId: cod.id,
          index: 3,
        },
      });
    } else {
      let shouldHideCOD = false;

      if (totalAmount < 1000 || totalAmount > 10000) shouldHideCOD = true;
      if (!isIndianOrder) shouldHideCOD = true;
      if (!prepaid) shouldHideCOD = true;

      if (shouldHideCOD) {
        operations.push({
          hide: { paymentMethodId: cod.id },
        });
      } else {
        operations.push({
          move: {
            paymentMethodId: cod.id,
            index: 3,
          },
        });
      }
    }
  }

  return { operations };
}
