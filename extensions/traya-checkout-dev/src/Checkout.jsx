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
  const subtotalAmount = useSubtotalAmount();

  const email = useEmail();
  const phone = usePhone();

  const addressUpdatedRef = useRef(false);

  /* ---------------- FREE PRODUCT QTY FIX ---------------- */
  const FREE_PRODUCT_VARIANT_ID =
    "gid://shopify/ProductVariant/45277154377906";

  useEffect(() => {
    console.log('version 43 cod checks')
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

  const restrictPhones = phone_numbers.split(",").map((p) => p.trim());

  const zipArrays = [
    pincode1,
    pincode2,
    pincode3,
    pincode4,
    pincode5,
    pincode6,
    pincode7,
  ].map((z) => z.split(",").map((p) => p.trim()));

  /* ---------------- HELPERS ---------------- */
  function formatPhone(phone) {
    if (!phone) return "";
    return phone.replace(/^\+91/, "").replace(/^0/, "");
  }

  const prepaidAttr = Attributes.find((a) => a.key === "prepaid");
  const currentPrepaid = prepaidAttr?.value;

  const zipcode = ShippingAddress?.zip;
  const shippingPhone = formatPhone(ShippingAddress?.phone);
  const countryCode = ShippingAddress?.countryCode;

  const cartTotal = subtotalAmount
    ? parseFloat(subtotalAmount.amount)
    : 0;

  /* ---------------- COD VALIDATION AFTER USER INPUT ---------------- */
  useEffect(() => {
    // wait until user enters required data
    if (!zipcode || !shippingPhone || !countryCode) return;

    const cartTotalInvalid = cartTotal < 1000 || cartTotal > 10000;
    const isInternational = countryCode !== "IN";
    const zipRestricted = zipArrays.some((z) => z.includes(zipcode));
    const phoneRestricted = restrictPhones.includes(shippingPhone);

    // prepaid = true means COD allowed
    const shouldBePrepaid =
      cartTotalInvalid || isInternational || zipRestricted || phoneRestricted
        ? "false"   // hide COD
        : "true";   // allow COD

    if (currentPrepaid !== shouldBePrepaid) {
      changeAttribute({
        type: "updateAttribute",
        key: "prepaid",
        value: shouldBePrepaid,
      });
    }
  }, [zipcode, shippingPhone, countryCode, cartTotal]);

  /* ---------------- AUTO ADDRESS FILL ---------------- */
  useEffect(() => {
    if (addressUpdatedRef.current) return;

    const firstNameAttr = Attributes.find((a) => a.key === "first_name");
    const phoneAttr = Attributes.find((a) => a.key === "phone");

    let address = {};

    if (firstNameAttr?.value) {
      const [firstName, lastName] = firstNameAttr.value.split(" ");
      address.firstName = firstName;
      if (lastName) address.lastName = lastName;
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

  /* ---------------- VALIDATION ---------------- */
  useBuyerJourneyIntercept(({ canBlockProgress }) => {
    const regex = /^(?:\+91)?[6789][0-9]{4}([ ]?)[0-9]{5}$/;
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,12}$/i;
    const nameRegex = /^[A-Za-z]+$/;
    return email === undefined && phone === undefined
      ? {
          behavior: "block",
          reason: "Email or phone is mandatory",
          errors: [
            {
              message: "Please enter email or phone number",
            },
          ],
        }
      : email !== undefined &&
        emailRegex.test(email) === false &&
        phone === undefined
      ? {
          behavior: "block",
          reason: "Invalid Email",
          errors: [
            {
              message: "Please enter valid email",
              target: "$.cart.buyerIdentity.email",
            },
          ],
        }
      : email === undefined &&
        phone !== undefined &&
        regex.test(phone) === false
      ? {
          behavior: "block",
          reason: "Invalid Phone",
          errors: [
            {
              message: "Please enter valid phone",
              target: "$.cart.buyerIdentity.phone",
            },
          ],
        }
      : ShippingAddress.firstName === undefined
      ? {
          behavior: "block",
          reason: "Invalid First Name",
          errors: [
            {
              message: "Please enter first name",
              target: "$.cart.deliveryGroups[0].deliveryAddress.firstName",
            },
          ],
        }
      : ShippingAddress?.firstName !== undefined &&
        nameRegex.test(ShippingAddress?.firstName) === false
      ? {
          behavior: "block",
          reason: "Invalid First Name",
          errors: [
            {
              message: "Please enter valid first name",
              target: "$.cart.deliveryGroups[0].deliveryAddress.firstName",
            },
          ],
        }
      : ShippingAddress.lastName === undefined
      ? {
          behavior: "block",
          reason: "Invalid Last Name",
          errors: [
            {
              message: "Please enter last name",
              target: "$.cart.deliveryGroups[0].deliveryAddress.lastName",
            },
          ],
        }
      : ShippingAddress.lastName !== undefined &&
        nameRegex.test(ShippingAddress?.lastName) === false
      ? {
          behavior: "block",
          reason: "Invalid Last Name",
          errors: [
            {
              message: "Please enter last name",
              target: "$.cart.deliveryGroups[0].deliveryAddress.lastName",
            },
          ],
        }
      : ShippingAddress?.address1 === undefined
      ? {
          behavior: "block",
          reason: "Address1 empty",
          errors: [
            {
              message: "Please enter address",
              target: "$.cart.deliveryGroups[0].deliveryAddress.address1",
            },
          ],
        }
      : ShippingAddress.address1 !== undefined &&
        ShippingAddress.address1.length < 15
      ? {
          behavior: "block",
          reason: "Address1 Invalid",
          errors: [
            {
              message: "Please enter atleast 15 characters",
              target: "$.cart.deliveryGroups[0].deliveryAddress.address1",
            },
          ],
        }
      : ShippingAddress?.phone === undefined
      ? {
          behavior: "block",
          reason: "Phone number empty",
          errors: [
            {
              message: "Please enter a phone number",
              target: "$.cart.deliveryGroups[0].deliveryAddress.phone",
            },
          ],
        }
      : ShippingAddress?.phone !== undefined &&
        regex.test(ShippingAddress?.phone) === false
      ? {
          behavior: "block",
          reason: "Invalid Phone number",
          errors: [
            {
              message: "Please enter valid number",
              target: "$.cart.deliveryGroups[0].deliveryAddress.phone",
            },
          ],
        }
      : {
          behavior: "allow",
        };
  });

  return null;
}
