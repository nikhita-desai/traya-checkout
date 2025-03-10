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
  const prepaid =
    input.cart?.prepaid === null
      ? true
      : input.cart.prepaid?.value === null
      ? true
      : input.cart.prepaid?.value === "false"
      ? false
      : true;

  if(razorPay) {
    operations.push({
      move: {
        paymentMethodId: razorPay?.id,
        index: input.paymentMethods.length - (input.paymentMethods.length - 1)
      }
    });
  }

  if(simpl) {
    operations.push({
      move: {
        paymentMethodId: simpl?.id,
        index: input.paymentMethods.length - (input.paymentMethods.length - 2)
      }
    });
  }

  if(snapmint) {
    operations.push({
      move: {
        paymentMethodId: snapmint?.id,
        index: input.paymentMethods.length - (input.paymentMethods.length - 3)
      }
    });
  }

  if (cod) {
    if (totalAmount < 1000.0) {
      operations.push({
        hide: {
          paymentMethodId: cod?.id,
          placements: cod?.placements,
        },
      });
    }
    if (totalAmount > 10000.0) {
      operations.push({
        hide: {
          paymentMethodId: cod?.id,
          placements: cod?.placements,
        },
      });
    }
    if (!prepaid) {
      operations.push({
        hide: {
          paymentMethodId: cod?.id,
          placements: cod?.placements,
        },
      });
    }
    operations.push({
      move: {
        paymentMethodId: cod?.id,
        index: input.paymentMethods.length - (input.paymentMethods.length - 4)
      }
    });
  }

  return {
    operations: operations,
  };
}
