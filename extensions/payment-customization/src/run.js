// @ts-check

/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 */

/**
 * @type {FunctionRunResult}
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
  
  // Find payment methods
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
  
  // Check prepaid attribute
  const prepaid =
    input.cart?.prepaid === null
      ? true
      : input.cart.prepaid?.value === null
      ? true
      : input.cart.prepaid?.value === "false"
      ? false
      : true;

  // Check if delivery address is in India
  const deliveryAddress = input.cart.deliveryGroups?.[0]?.deliveryAddress;
  const isIndianOrder = deliveryAddress?.countryCode === "IN";

  // Move Razorpay to position 0 (first)
  if (razorPay) {
    operations.push({
      move: {
        paymentMethodId: razorPay.id,
        index: 0
      }
    });
  }

  // Move Simpl to position 1 (second)
  if (simpl) {
    operations.push({
      move: {
        paymentMethodId: simpl.id,
        index: 1
      }
    });
  }

  // Move Snapmint to position 2 (third)
  if (snapmint) {
    operations.push({
      move: {
        paymentMethodId: snapmint.id,
        index: 2
      }
    });
  }

  // COD logic with all conditions
  if (cod) {
    let shouldHideCOD = false;

    // Hide COD if order total is less than ₹1000
    if (totalAmount < 1000.0) {
      shouldHideCOD = true;
    }

    // Hide COD if order total is greater than ₹10,000
    if (totalAmount > 10000.0) {
      shouldHideCOD = true;
    }

    // Hide COD if prepaid attribute is false
    if (!prepaid) {
      shouldHideCOD = true;
    }

    // Hide COD for international orders (non-Indian addresses)
    if (!isIndianOrder) {
      shouldHideCOD = true;
    }

    // Apply hide or move operation
    if (shouldHideCOD) {
      operations.push({
        hide: {
          paymentMethodId: cod.id
        }
      });
    } else {
      // Move COD to position 3 (fourth) only if not hiding it
      operations.push({
        move: {
          paymentMethodId: cod.id,
          index: 3
        }
      });
    }
  }

  return {
    operations: operations,
  };
}