import {
  reactExtension,
  useApplyAttributeChange,
  useApplyShippingAddressChange,
  useAttributes,
  useBuyerJourneyIntercept,
  useEmail,
  usePhone,
  useSettings,
  useShippingAddress,
  useCartLines,
  useApplyCartLinesChange,
  useSubtotalAmount,
} from "@shopify/ui-extensions-react/checkout";

import { useEffect, useRef, useMemo } from "react";

export default reactExtension("purchase.checkout.block.render", () => (
  <Extension />
));

/* ---------------- ADDRESS VALIDATION HELPERS ---------------- */

const hasRepeatedSpecialCharacters = (text) => {
  if (!text || typeof text !== "string") return false;
  return /([!@#$%^&*()_+=\[\]{}|;:'",.<>?/\\`~-])\1{2,}/.test(text);
};

const containsOnlyPrintableASCII = (text) => {
  if (!text || typeof text !== "string") return false;
  for (const char of text) {
    const code = char.charCodeAt(0);
    if (code < 32 || code > 126) return false;
  }
  return true;
};

const validateAddress = (address) => {
  if (!address) return [];

  const errors = [];

  const addr1 = address.address1?.trim();
  const city = address.city?.trim();
  const zip = address.zip?.trim();

  /* ---- Address line ---- */
  if (!addr1 || addr1.length < 5) {
    errors.push({
      message: "Please enter a complete address",
      target: "$.cart.deliveryGroups[0].deliveryAddress.address1",
    });
  } 
  else if (!/[a-zA-Z]/.test(addr1)) {
    errors.push({
      message: "Please enter a valid address (street or area name required)",
      target: "$.cart.deliveryGroups[0].deliveryAddress.address1",
    });
  }
  else if (!containsOnlyPrintableASCII(addr1)) {
    errors.push({
      message: "Address contains invalid characters",
      target: "$.cart.deliveryGroups[0].deliveryAddress.address1",
    });
  }
  else if (hasRepeatedSpecialCharacters(addr1)) {
    errors.push({
      message: "Address contains invalid repeated characters",
      target: "$.cart.deliveryGroups[0].deliveryAddress.address1",
    });
  }

  /* ---- City ---- */
  if (city) {
    if (city.length < 2) {
      errors.push({
        message: "Please enter a valid city",
        target: "$.cart.deliveryGroups[0].deliveryAddress.city",
      });
    } else if (!containsOnlyPrintableASCII(city)) {
      errors.push({
        message: "City contains invalid characters",
        target: "$.cart.deliveryGroups[0].deliveryAddress.city",
      });
    } else if (hasRepeatedSpecialCharacters(city)) {
      errors.push({
        message: "City contains invalid characters",
        target: "$.cart.deliveryGroups[0].deliveryAddress.city",
      });
    }
  }

  /* ---- PIN ---- */
  if (zip) {
    if (!/^[1-9][0-9]{5}$/.test(zip)) {
      errors.push({
        message: "Please enter a valid 6-digit PIN code",
        target: "$.cart.deliveryGroups[0].deliveryAddress.zip",
      });
    }
  }

  return errors;
};

/* ---------------- MAIN EXTENSION ---------------- */
function Extension() {
  const changeAttribute = useApplyAttributeChange();
  const applyCartLinesChange = useApplyCartLinesChange();
  const changeAddress = useApplyShippingAddressChange();
  console.log("54 version - experiment1 banner changes");

  const attributes = useAttributes();
  const cartLines = useCartLines();
  const shippingAddress = useShippingAddress();
  const subtotalAmount = useSubtotalAmount();

  const email = useEmail();
  const phone = usePhone();

  const addressAttemptedRef = useRef(false);
  const processingCartRef = useRef(false);
  const processingAttrRef = useRef(false);

  const FREE_PRODUCT_VARIANT_ID = "gid://shopify/ProductVariant/45277154377906";

  /* ---------------- SETTINGS ---------------- */
  let {
    pincode1 = "201301",
    pincode2 = "",
    pincode3 = "",
    pincode4 = "",
    pincode5 = "",
    pincode6 = "",
    pincode7 = "",
    phone_numbers = "9058222810",
  } = useSettings();

  pincode2 ||= pincode1;
  pincode3 ||= pincode1;
  pincode4 ||= pincode1;
  pincode5 ||= pincode1;
  pincode6 ||= pincode1;
  pincode7 ||= pincode1;

  const restrictPhones = useMemo(
    () => phone_numbers.split(",").map((p) => p.trim()),
    [phone_numbers]
  );

  const zipArrays = useMemo(
    () =>
      [pincode1, pincode2, pincode3, pincode4, pincode5, pincode6, pincode7].map(
        (z) => z.split(",").map((p) => p.trim())
      ),
    [pincode1, pincode2, pincode3, pincode4, pincode5, pincode6, pincode7]
  );

  function formatPhone(p) {
    if (!p) return "";
    return p.replace(/^\+91/, "").replace(/^0/, "");
  }

  const zipcode = shippingAddress?.zip;
  const shippingPhoneFormatted = formatPhone(shippingAddress?.phone);
  const countryCode = shippingAddress?.countryCode;

  const cartTotal = subtotalAmount ? parseFloat(subtotalAmount.amount) : 0;

  /* ---------------- FREE PRODUCT QTY FIX ---------------- */
  useEffect(() => {
    if (processingCartRef.current) return;

    const freeProductLine = cartLines.find(
      (line) =>
        line.merchandise.id === FREE_PRODUCT_VARIANT_ID &&
        line.quantity > 1
    );

    if (freeProductLine) {
      processingCartRef.current = true;

      applyCartLinesChange({
        type: "updateCartLine",
        id: freeProductLine.id,
        quantity: 1,
      }).finally(() => {
        processingCartRef.current = false;
      });
    }
  }, [cartLines, applyCartLinesChange]);

  /* ---------------- SET PREPAID ATTRIBUTE ---------------- */
  useEffect(() => {
    if (processingAttrRef.current) return;
    if (!zipcode || !shippingPhoneFormatted || !countryCode) return;

    const cartTotalInvalid = cartTotal < 1000 || cartTotal > 10000;
    const isInternational = countryCode !== "IN";
    const zipRestricted = zipArrays.some((z) => z.includes(zipcode));
    const phoneRestricted = restrictPhones.includes(shippingPhoneFormatted);

    const shouldBePrepaid =
      cartTotalInvalid || isInternational || zipRestricted || phoneRestricted
        ? "false"
        : "true";

    const prepaidAttr = attributes.find((a) => a.key === "prepaid");
    const currentPrepaid = prepaidAttr?.value;

    if (currentPrepaid !== shouldBePrepaid) {
      processingAttrRef.current = true;

      changeAttribute({
        type: "updateAttribute",
        key: "prepaid",
        value: shouldBePrepaid,
      }).finally(() => {
        processingAttrRef.current = false;
      });
    }
  }, [
    zipcode,
    shippingPhoneFormatted,
    countryCode,
    cartTotal,
    attributes,
    changeAttribute,
    zipArrays,
    restrictPhones,
  ]);

  /* ---------------- AUTO ADDRESS FILL ---------------- */
  useEffect(() => {
    if (addressAttemptedRef.current) return;

    const firstNameAttr = attributes.find((a) => a.key === "first_name");
    const phoneAttr = attributes.find((a) => a.key === "phone");

    if (!firstNameAttr && !phoneAttr) return;

    let address = {};

    if (firstNameAttr?.value) {
      const [firstName, ...lastNameParts] = firstNameAttr.value.split(" ");
      address.firstName = firstName;
      if (lastNameParts.length) {
        address.lastName = lastNameParts.join(" ");
      }
    }

    if (phoneAttr?.value) {
      const formatted = formatPhone(phoneAttr.value);
      address.phone = formatted;
      address.countryCode = formatted.length === 10 ? "IN" : "AE";
    }

    if (Object.keys(address).length) {
      addressAttemptedRef.current = true;
      changeAddress({ type: "updateShippingAddress", address }).catch(() => {
        addressAttemptedRef.current = false;
      });
    }
  }, [attributes, changeAddress]);

  /* ---------------- VALIDATION ---------------- */
  useBuyerJourneyIntercept(({ canBlockProgress }) => {
    if (!canBlockProgress) return { behavior: "allow" };

    const phoneRegex = /^(?:\+91)?[6789][0-9]{9}$/;
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,12}$/i;

    const shippingPhone = shippingAddress?.phone;

    if (!email && !phone && !shippingPhone) {
      return {
        behavior: "block",
        reason: "missing_contact",
        errors: [{ message: "Please enter email or phone number" }],
      };
    }

    if (email && !emailRegex.test(email)) {
      return {
        behavior: "block",
        reason: "invalid_email",
        errors: [{ message: "Please enter a valid email" }],
      };
    }

    if (phone && !phoneRegex.test(phone)) {
      return {
        behavior: "block",
        reason: "invalid_phone",
        errors: [{ message: "Please enter a valid phone number" }],
      };
    }

    if (shippingPhone && !phoneRegex.test(shippingPhone)) {
      return {
        behavior: "block",
        reason: "invalid_shipping_phone",
        errors: [
          {
            message: "Please enter a valid phone number",
            target: "$.cart.deliveryGroups[0].deliveryAddress.phone",
          },
        ],
      };
    }

    const addressErrors = validateAddress(shippingAddress);

    if (addressErrors.length > 0) {
      return {
        behavior: "block",
        reason: "invalid_address",
        errors: addressErrors,
      };
    }

    return { behavior: "allow" };
  });

  return null;
}