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

function Extension() {
  const changeAttribute = useApplyAttributeChange();
  const applyCartLinesChange = useApplyCartLinesChange();
  const changeAddress = useApplyShippingAddressChange();
  console.log('45 version - improved');

  const Attributes = useAttributes();
  const cartLines = useCartLines();
  const ShippingAddress = useShippingAddress();
  const subtotalAmount = useSubtotalAmount();

  const email = useEmail();
  const phone = usePhone();

  const addressAttemptedRef = useRef(false);
  const isFinalStepRef = useRef(false);
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

  // Memoize to prevent recalculation on every render
  const restrictPhones = useMemo(
    () => phone_numbers.split(",").map((p) => p.trim()),
    [phone_numbers]
  );

  const zipArrays = useMemo(
    () => [pincode1, pincode2, pincode3, pincode4, pincode5, pincode6, pincode7]
        .map((z) => z.split(",").map((p) => p.trim())),
    [pincode1, pincode2, pincode3, pincode4, pincode5, pincode6, pincode7]
  );

  /* ---------------- HELPERS ---------------- */
  function formatPhone(phone) {
    if (!phone) return "";
    return phone.replace(/^\+91/, "").replace(/^0/, "");
  }

  const zipcode = ShippingAddress?.zip;
  const shippingPhone = formatPhone(ShippingAddress?.phone);
  const countryCode = ShippingAddress?.countryCode;

  const cartTotal = subtotalAmount ? parseFloat(subtotalAmount.amount) : 0;

  /* ---------------- FREE PRODUCT QTY FIX ---------------- */
  useEffect(() => {
    console.log('45 version - improved');
    if (isFinalStepRef.current || processingCartRef.current) return;

    const freeProductLine = cartLines.find(
      (line) => line.merchandise.id === FREE_PRODUCT_VARIANT_ID && line.quantity > 1
    );

    if (freeProductLine) {
      processingCartRef.current = true;
      
      applyCartLinesChange({
        type: "updateCartLine",
        id: freeProductLine.id,
        quantity: 1,
      })
        .then(() => {
          processingCartRef.current = false;
        })
        .catch((error) => {
          console.error('Cart update failed:', error);
          processingCartRef.current = false;
        });
    }
  }, [cartLines, applyCartLinesChange, FREE_PRODUCT_VARIANT_ID]);

  /* ---------------- COD VALIDATION AFTER USER INPUT ---------------- */
  useEffect(() => {
    if (isFinalStepRef.current || processingAttrRef.current) return;
    if (!zipcode || !shippingPhone || !countryCode) return;

    const cartTotalInvalid = cartTotal < 1000 || cartTotal > 10000;
    const isInternational = countryCode !== "IN";
    const zipRestricted = zipArrays.some((z) => z.includes(zipcode));
    const phoneRestricted = restrictPhones.includes(shippingPhone);

    const shouldBePrepaid =
      cartTotalInvalid || isInternational || zipRestricted || phoneRestricted
        ? "false"
        : "true";

    const prepaidAttr = Attributes.find((a) => a.key === "prepaid");
    const currentPrepaid = prepaidAttr?.value;

    if (currentPrepaid !== shouldBePrepaid) {
      processingAttrRef.current = true;
      
      changeAttribute({
        type: "updateAttribute",
        key: "prepaid",
        value: shouldBePrepaid,
      })
        .then(() => {
          processingAttrRef.current = false;
        })
        .catch((error) => {
          console.error('Attribute update failed:', error);
          processingAttrRef.current = false;
        });
    }
  }, [zipcode, shippingPhone, countryCode, cartTotal, Attributes, changeAttribute, zipArrays, restrictPhones]);

  /* ---------------- AUTO ADDRESS FILL ---------------- */
  useEffect(() => {
    if (isFinalStepRef.current || addressAttemptedRef.current) return;

    const firstNameAttr = Attributes.find((a) => a.key === "first_name");
    const phoneAttr = Attributes.find((a) => a.key === "phone");

    // Don't proceed if attributes haven't loaded yet
    if (!firstNameAttr && !phoneAttr) return;

    let address = {};

    if (firstNameAttr?.value) {
      const [firstName, ...lastNameParts] = firstNameAttr.value.split(" ");
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
      addressAttemptedRef.current = true;
      
      changeAddress({
        type: "updateShippingAddress",
        address,
      }).catch((error) => {
        console.error('Address update failed:', error);
        // Allow retry on error
        addressAttemptedRef.current = false;
      });
    }
  }, [Attributes, changeAddress]);

  /* ---------------- VALIDATION ---------------- */
  useBuyerJourneyIntercept(({ canBlockProgress }) => {
    if (!canBlockProgress) {
      isFinalStepRef.current = true;
    }

    const regex = /^(?:\+91)?[6789][0-9]{4}([ ]?)[0-9]{5}$/;
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,12}$/i;
    const nameRegex = /^[A-Za-z]+$/;

    if (email === undefined && phone === undefined) {
      return {
        behavior: "block",
        reason: "Email or phone is mandatory",
        errors: [{ message: "Please enter email or phone number" }],
      };
    }

    if (email !== undefined && !emailRegex.test(email) && phone === undefined) {
      return {
        behavior: "block",
        reason: "Invalid Email",
        errors: [
          {
            message: "Please enter valid email",
            target: "$.cart.buyerIdentity.email",
          },
        ],
      };
    }

    if (email === undefined && phone !== undefined && !regex.test(phone)) {
      return {
        behavior: "block",
        reason: "Invalid Phone",
        errors: [
          {
            message: "Please enter valid phone",
            target: "$.cart.buyerIdentity.phone",
          },
        ],
      };
    }

    if (ShippingAddress.firstName === undefined) {
      return {
        behavior: "block",
        reason: "Invalid First Name",
        errors: [
          {
            message: "Please enter first name",
            target: "$.cart.deliveryGroups[0].deliveryAddress.firstName",
          },
        ],
      };
    }

    if (ShippingAddress?.firstName !== undefined && !nameRegex.test(ShippingAddress?.firstName)) {
      return {
        behavior: "block",
        reason: "Invalid First Name",
        errors: [
          {
            message: "Please enter valid first name",
            target: "$.cart.deliveryGroups[0].deliveryAddress.firstName",
          },
        ],
      };
    }

    if (ShippingAddress.lastName === undefined) {
      return {
        behavior: "block",
        reason: "Invalid Last Name",
        errors: [
          {
            message: "Please enter last name",
            target: "$.cart.deliveryGroups[0].deliveryAddress.lastName",
          },
        ],
      };
    }

    if (ShippingAddress.lastName !== undefined && !nameRegex.test(ShippingAddress?.lastName)) {
      return {
        behavior: "block",
        reason: "Invalid Last Name",
        errors: [
          {
            message: "Please enter last name",
            target: "$.cart.deliveryGroups[0].deliveryAddress.lastName",
          },
        ],
      };
    }

    if (ShippingAddress?.address1 === undefined) {
      return {
        behavior: "block",
        reason: "Address1 empty",
        errors: [
          {
            message: "Please enter address",
            target: "$.cart.deliveryGroups[0].deliveryAddress.address1",
          },
        ],
      };
    }

    if (ShippingAddress.address1 !== undefined && ShippingAddress.address1.length < 15) {
      return {
        behavior: "block",
        reason: "Address1 Invalid",
        errors: [
          {
            message: "Please enter atleast 15 characters",
            target: "$.cart.deliveryGroups[0].deliveryAddress.address1",
          },
        ],
      };
    }

    if (ShippingAddress?.phone === undefined) {
      return {
        behavior: "block",
        reason: "Phone number empty",
        errors: [
          {
            message: "Please enter a phone number",
            target: "$.cart.deliveryGroups[0].deliveryAddress.phone",
          },
        ],
      };
    }

    if (ShippingAddress?.phone !== undefined && !regex.test(ShippingAddress?.phone)) {
      return {
        behavior: "block",
        reason: "Invalid Phone number",
        errors: [
          {
            message: "Please enter valid number",
            target: "$.cart.deliveryGroups[0].deliveryAddress.phone",
          },
        ],
      };
    }

    return { behavior: "allow" };
  });

  return null;
}