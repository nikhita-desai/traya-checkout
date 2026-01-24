// @ts-check

/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 */

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function run(input) {
  const operations = [];
  const totalAmount = parseFloat(input.cart.cost.totalAmount.amount);

  // ---------------- FIND PAYMENT METHODS ----------------
  const cod = input.paymentMethods.find(
    (m) =>
      m.__typename === "PaymentCustomizationPaymentMethod" &&
      m.name.toLowerCase().includes("cod")
  );

  const razorPay = input.paymentMethods.find(
    (m) =>
      m.__typename === "PaymentCustomizationPaymentMethod" &&
      m.name.toLowerCase().includes("razorpay")
  );

  const simpl = input.paymentMethods.find(
    (m) =>
      m.__typename === "PaymentCustomizationPaymentMethod" &&
      m.name.toLowerCase().includes("simpl")
  );

  const snapmint = input.paymentMethods.find(
    (m) =>
      m.__typename === "PaymentCustomizationPaymentMethod" &&
      m.name.toLowerCase().includes("snapmint")
  );

  // ---------------- PAYMENT ORDER ----------------
  if (razorPay) operations.push({ move: { paymentMethodId: razorPay.id, index: 0 }});
  if (simpl) operations.push({ move: { paymentMethodId: simpl.id, index: 1 }});
  if (snapmint) operations.push({ move: { paymentMethodId: snapmint.id, index: 2 }});

  // ---------------- PREPAID ATTRIBUTE ----------------
  // This attribute is set by checkout.jsx after user enters pincode & phone
  const prepaidAttr = input.cart?.prepaid;
  const hasEligibilityData =
    prepaidAttr?.value !== null && prepaidAttr?.value !== undefined;

  // true = COD allowed, false = COD blocked
  const prepaid = prepaidAttr?.value === "true";

  // ---------------- COD LOGIC ----------------
  if (cod) {
    // Page load → show COD
    if (!hasEligibilityData) {
      operations.push({
        move: {
          paymentMethodId: cod.id,
          index: 3,
        },
      });
    } else {
      let shouldHideCOD = false;

      // 1. Amount rule
      if (totalAmount < 1000 || totalAmount > 10000) {
        shouldHideCOD = true;
      }

      // 2. Country rule (only if country exists)
      const countryCode =
        input.cart.deliveryGroups?.[0]?.deliveryAddress?.countryCode;

      if (countryCode && countryCode !== "IN") {
        shouldHideCOD = true;
      }

      // 3 & 4. Pincode + phone rule (from checkout.jsx)
      if (!prepaid) {
        shouldHideCOD = true;
      }

      // Apply result
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
