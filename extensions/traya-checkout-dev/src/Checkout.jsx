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
} from "@shopify/ui-extensions-react/checkout";
import { useEffect, useRef } from "react";

export default reactExtension("purchase.checkout.block.render", () => (
  <Extension />
));

function Extension() {
  const changeAttribute = useApplyAttributeChange();
  const applyCartLinesChange = useApplyCartLinesChange();
  const changeAddress = useApplyShippingAddressChange();

  const Attributes = useAttributes();
  const cartLines = useCartLines();
  const ShippingAddress = useShippingAddress();

  const email = useEmail();
  const phone = usePhone();

  const addressUpdatedRef = useRef(false);

  /* ---------------- FREE PRODUCT QTY FIX ---------------- */
  const FREE_PRODUCT_VARIANT_ID =
    "gid://shopify/ProductVariant/45277154377906";

  useEffect(() => {
    console.log('version 16')
    cartLines.forEach((line) => {
      if (
        line.merchandise.id === FREE_PRODUCT_VARIANT_ID &&
        line.quantity > 1
      ) {
        applyCartLinesChange({
          type: "updateCartLine",
          id: line.id,
          quantity: 1,
        });
      }
    });
  }, [cartLines]);

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

  const restrictPhones = phone_numbers.split(",");

  const zipArrays = [
    pincode1,
    pincode2,
    pincode3,
    pincode4,
    pincode5,
    pincode6,
    pincode7,
  ].map((z) => z.split(","));

  /* ---------------- HELPERS ---------------- */
  function formatPhone(phone) {
    if (!phone) return "";
    return phone.replace(/^\+91/, "").replace(/^0/, "");
  }

  const prepaidAttr = Attributes.find((a) => a.key === "prepaid");
  const currentPrepaid = prepaidAttr?.value;
  const zipcode = ShippingAddress?.zip;
  const shippingPhone = formatPhone(ShippingAddress?.phone);

  /* ---------------- PREPAID LOGIC (SAFE) ---------------- */
  useEffect(() => {
    if (!zipcode) return;

    const zipAllowed = zipArrays.some((z) => z.includes(zipcode));
    const phoneRestricted = restrictPhones.includes(shippingPhone);

    const shouldBePrepaid =
      zipAllowed && !phoneRestricted ? "true" : "false";

    if (currentPrepaid !== shouldBePrepaid) {
      changeAttribute({
        type: "updateAttribute",
        key: "prepaid",
        value: shouldBePrepaid,
      });
    }
  }, [zipcode, shippingPhone]);

/* ---------------- AUTO ADDRESS FILL (FIX +1 ISSUE) ---------------- */
  useEffect(() => {
    const firstNameAttr = Attributes.find(a => a.key === "first_name");
    const phoneAttr = Attributes.find(a => a.key === "phone");

    // nothing to update yet
    if (!firstNameAttr?.value && !phoneAttr?.value) return;

    // clone existing shipping address to avoid losing fields
    let address = { ...ShippingAddress };

    // ---- NAME ----
    if (firstNameAttr?.value) {
      const [firstName, lastName] = firstNameAttr.value.split(" ");
      address.firstName = firstName || "";
      address.lastName = lastName || "";
    }

    // ---- PHONE ----
    if (phoneAttr?.value) {
      const formatted = formatPhone(phoneAttr.value);

      address.phone = formatted;

      // 🔥 FORCE INDIA FOR 10 DIGITS
      if (formatted.length === 10) {
        address.countryCode = "IN";
      }

      // fallback to IN if missing
      if (!address.countryCode) {
        address.countryCode = "IN";
      }
    }

    changeAddress({
      type: "updateShippingAddress",
      address,
    });

  }, [Attributes, ShippingAddress]);

  /* ---------------- VALIDATION ---------------- */
  useBuyerJourneyIntercept(({ canBlockProgress }) => {
    if (!canBlockProgress) return { behavior: "allow" };

    const phoneRegex = /^(?:\+91)?[6789][0-9]{9}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const nameRegex = /^[A-Za-z]+$/;

    if (!email && !phone) {
      return {
        behavior: "block",
        errors: [{ message: "Email or phone is required" }],
      };
    }

    if (email && !emailRegex.test(email)) {
      return {
        behavior: "block",
        errors: [{ message: "Invalid email" }],
      };
    }

    if (phone && !phoneRegex.test(phone)) {
      return {
        behavior: "block",
        errors: [{ message: "Invalid phone number" }],
      };
    }

    if (
      !ShippingAddress?.firstName ||
      !nameRegex.test(ShippingAddress.firstName)
    ) {
      return {
        behavior: "block",
        errors: [{ message: "Invalid first name" }],
      };
    }

    if (
      !ShippingAddress?.lastName ||
      !nameRegex.test(ShippingAddress.lastName)
    ) {
      return {
        behavior: "block",
        errors: [{ message: "Invalid last name" }],
      };
    }

    return { behavior: "allow" };
  });

  return null;
}
