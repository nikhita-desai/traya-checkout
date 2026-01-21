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

  // ---------------- PREPAID ATTRIBUTE ----------------
  // IMPORTANT:
  // - attribute does NOT exist on page load
  // - exists only after pincode logic runs in checkout JSX
  const prepaidAttr = input.cart.prepaid;
  const hasEligibilityData = prepaidAttr?.value !== null;

  const prepaid =
    prepaidAttr?.value === "false" ? false : true;

  // ---------------- PAYMENT ORDERING ----------------
  if (razorPay) {
    operations.push({
      move: {
        paymentMethodId: razorPay.id,
        index: 0,
      },
    });
  }

  if (simpl) {
    operations.push({
      move: {
        paymentMethodId: simpl.id,
        index: 1,
      },
    });
  }

  if (snapmint) {
    operations.push({
      move: {
        paymentMethodId: snapmint.id,
        index: 2,
      },
    });
  }

  // ---------------- COD LOGIC (2026 SAFE) ----------------
  if (cod) {
    let shouldHideCOD = false;

    /**
     * 🚨 CRITICAL RULE (2026-01):
     * Do NOT evaluate COD rules until checkout JSX
     * has calculated eligibility and set the attribute.
     */
    if (hasEligibilityData) {
      // Amount rules
      if (totalAmount < 1000.0 || totalAmount > 10000.0) {
        shouldHideCOD = true;
      }

      // Prepaid rule
      if (!prepaid) {
        shouldHideCOD = true;
      }

      // Country rule (only reliable address field in 2026)
      const countryCode =
        input.cart.deliveryGroups?.[0]?.deliveryAddress?.countryCode;

      if (countryCode && countryCode !== "IN") {
        shouldHideCOD = true;
      }
    }

    if (shouldHideCOD) {
      operations.push({
        hide: {
          paymentMethodId: cod.id,
        },
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

  return { operations };
}
