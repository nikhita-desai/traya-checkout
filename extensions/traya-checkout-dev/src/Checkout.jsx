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
  const initialPrepaidSetRef = useRef(false);

  /* ---------------- FREE PRODUCT QTY FIX ---------------- */
  const FREE_PRODUCT_VARIANT_ID =
    "gid://shopify/ProductVariant/45277154377906";

  useEffect(() => {
    console.log('version 20 - COD visibility fix')
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

  const restrictPhones = phone_numbers.split(",").map(p => p.trim());

  const zipArrays = [
    pincode1,
    pincode2,
    pincode3,
    pincode4,
    pincode5,
    pincode6,
    pincode7,
  ].map((z) => z.split(",").map(code => code.trim()));

  /* ---------------- HELPERS ---------------- */
  function formatPhone(phone) {
    if (!phone) return "";
    return phone.replace(/^\+91/, "").replace(/^0/, "").trim();
  }

  const prepaidAttr = Attributes.find((a) => a.key === "prepaid");
  const currentPrepaid = prepaidAttr?.value;
  const zipcode = ShippingAddress?.zip?.trim();
  const shippingPhone = formatPhone(ShippingAddress?.phone);

  /* ---------------- INITIAL PREPAID SETUP (NEW) ---------------- */
  // Set prepaid to "false" (allow COD) on first load if not already set
  // This ensures COD is visible by default
  useEffect(() => {
    if (initialPrepaidSetRef.current) return;
    
    if (!currentPrepaid) {
      initialPrepaidSetRef.current = true;
      changeAttribute({
        type: "updateAttribute",
        key: "prepaid",
        value: "false", // Default: allow COD
      });
    }
  }, [currentPrepaid]);

  /* ---------------- PREPAID LOGIC (UPDATED) ---------------- */
  useEffect(() => {
    // Only update prepaid logic once we have a zipcode
    if (!zipcode) return;

    const zipAllowed = zipArrays.some((z) => z.includes(zipcode));
    const phoneRestricted = restrictPhones.includes(shippingPhone);

    // If zipcode is allowed AND phone is not restricted = COD allowed (prepaid="false")
    // Otherwise = Prepaid only (prepaid="true", hides COD)
    const shouldBePrepaid = zipAllowed && !phoneRestricted ? "false" : "true";

    if (currentPrepaid !== shouldBePrepaid) {
      changeAttribute({
        type: "updateAttribute",
        key: "prepaid",
        value: shouldBePrepaid,
      });
    }
  }, [zipcode, shippingPhone]);

  /* ---------------- AUTO ADDRESS FILL (SAFE) ---------------- */
  useEffect(() => {
    if (addressUpdatedRef.current) return;

    const firstNameAttr = Attributes.find((a) => a.key === "first_name");
    const phoneAttr = Attributes.find((a) => a.key === "phone");

    let address = {};

    if (firstNameAttr?.value) {
      const [firstName, ...lastNameParts] = firstNameAttr.value.trim().split(" ");
      address.firstName = firstName;
      if (lastNameParts.length > 0) {
        address.lastName = lastNameParts.join(" ");
      }
    }

    if (phoneAttr?.value) {
      const formatted = formatPhone(phoneAttr.value);
      address.phone = formatted;
      address.countryCode = formatted.length === 10 ? "IN" : "AE";
    }

    if (Object.keys(address).length > 0) {
      addressUpdatedRef.current = true;
      changeAddress({
        type: "updateShippingAddress",
        address,
      });
    }
  }, [Attributes]);

  /* ---------------- VALIDATION (FIXED) ---------------- */
  useBuyerJourneyIntercept(({ canBlockProgress }) => {
    if (!canBlockProgress) return { behavior: "allow" };

    const phoneRegex = /^(?:\+91)?[6789][0-9]{9}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // FIXED: Allow spaces, hyphens, apostrophes, and periods in names
    const nameRegex = /^[A-Za-z\s'\-\.]+$/;

    if (!email && !phone) {
      return {
        behavior: "block",
        errors: [{ message: "Email or phone is required" }],
      };
    }

    if (email && !emailRegex.test(email)) {
      return {
        behavior: "block",
        errors: [{ message: "Invalid email format" }],
      };
    }

    if (phone && !phoneRegex.test(phone)) {
      return {
        behavior: "block",
        errors: [{ message: "Invalid phone number format" }],
      };
    }

    // Validate first name
    if (ShippingAddress?.firstName) {
      const trimmedFirstName = ShippingAddress.firstName.trim();
      if (!trimmedFirstName || trimmedFirstName.length < 2 || !nameRegex.test(trimmedFirstName)) {
        return {
          behavior: "block",
          errors: [{ message: "Please enter a valid first name (minimum 2 characters)" }],
        };
      }
    } else {
      return {
        behavior: "block",
        errors: [{ message: "First name is required" }],
      };
    }

    // Validate last name only if it exists
    if (ShippingAddress?.lastName) {
      const trimmedLastName = ShippingAddress.lastName.trim();
      if (trimmedLastName.length > 0 && !nameRegex.test(trimmedLastName)) {
        return {
          behavior: "block",
          errors: [{ message: "Please enter a valid last name" }],
        };
      }
    }

    return { behavior: "allow" };
  });

  return null;
}