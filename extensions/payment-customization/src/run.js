// @ts-check

/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 */

const PRIORITY = ["razorpay", "cod", "snapmint", "simpl"];
/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function run(input) {
  /** @type {Array<any>} */
  const operations = [];

  const methods = input.paymentMethods ?? [];
  const totalAmount = parseFloat(input.cart?.cost?.totalAmount?.amount ?? "0");

  /** @param {string} needle */
  const byName = (needle) =>
    methods.find((m) => m.name?.toLowerCase().includes(needle));

  // ---------------- COD ELIGIBILITY ----------------
  const prepaidAttr = input.cart?.prepaid;
  const hasEligibilityData =
    prepaidAttr?.value !== null && prepaidAttr?.value !== undefined;

  const prepaid = prepaidAttr?.value === "true";
  const countryCode =
    input.cart?.deliveryGroups?.[0]?.deliveryAddress?.countryCode;

  let hideCOD = false;
  if (totalAmount < 1000 || totalAmount > 10000) hideCOD = true;          // cart-value band
  if (hasEligibilityData && countryCode && countryCode !== "IN") hideCOD = true; // non-IN
  if (hasEligibilityData && !prepaid) hideCOD = true;                     // prepaid-only

  const cod = byName("cod");

  /** Methods to hide (kept out of the reorder so a method is never moved AND hidden). */
  const hiddenIds = new Set();
  if (cod && hideCOD) hiddenIds.add(cod.id);

  // ---------------- BUILD EXPLICIT ORDER ----------------
  // 1) Priority methods that exist and aren't hidden, in PRIORITY order.
  // 2) (Everything else stays unmoved and naturally falls after this block.)
  /** @type {Array<any>} */
  const ordered = [];
  const seen = new Set();

  for (const needle of PRIORITY) {
    const method = byName(needle);
    if (method && !hiddenIds.has(method.id) && !seen.has(method.id)) {
      ordered.push(method);
      seen.add(method.id);
    }
  }

  // ---------------- EMIT OPERATIONS ----------------
  for (const id of hiddenIds) {
    operations.push({ hide: { paymentMethodId: id } });
  }

  // Contiguous indices 0,1,2... — no gaps, so unmoved methods can't wedge in between.
  ordered.forEach((m, index) => {
    operations.push({ move: { paymentMethodId: m.id, index } });
  });

  // ---------------- DEBUG (remove before release) ----------------
  console.log(
    "PAYMENT_METHODS:",
    JSON.stringify(methods.map((m) => ({ id: m.id, name: m.name })))
  );
  console.log("HIDE_COD:", hideCOD);
  console.log(
    "FINAL_ORDER:",
    JSON.stringify(ordered.map((m) => m.name))
  );
  console.log("OPERATIONS:", JSON.stringify(operations));

  return { operations };
}
