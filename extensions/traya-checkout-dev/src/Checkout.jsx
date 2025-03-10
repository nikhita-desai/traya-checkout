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
} from "@shopify/ui-extensions-react/checkout";
import { useEffect } from "react";

export default reactExtension("purchase.checkout.block.render", () => (
  <Extension /> 
));

function Extension() {
  const changeAttribute = useApplyAttributeChange();
  const Attributes = useAttributes();
  const lastAttribute = Attributes.filter((attribute) => {
    if (attribute.key === "prepaid") {
      return attribute; 
    }
  });
  function formatPhoneNumber(phoneNumber) {
    let formattedNumber = phoneNumber;
    if (formattedNumber !== undefined && formattedNumber !== null) {
      formattedNumber = phoneNumber?.replace(/^\+91/, "");
      formattedNumber = formattedNumber?.replace(/^0/, "");
    }
    return formattedNumber;
  }
  var {
    pincode1,
    pincode2,
    pincode3,
    pincode4,
    pincode5,
    pincode6,
    pincode7,
    phone_numbers,
  } = useSettings();
  if (pincode1 === null || pincode1 === undefined) {
    pincode1 = "201301";
  }
  if (pincode2 === null || pincode2 === undefined) {
    pincode2 = "";
  }
  if (pincode3 === null || pincode3 === undefined) {
    pincode3 = "";
  }
  if (pincode4 === null || pincode4 === undefined) {
    pincode4 = "";
  }
  if (pincode5 === null || pincode5 === undefined) {
    pincode5 = "";
  }
  if (pincode6 === null || pincode6 === undefined) {
    pincode6 = "";
  }
  if (pincode7 === null || pincode7 === undefined) {
    pincode7 = "";
  }
  if (pincode2 === "") {
    pincode2 = pincode1;
  }
  if (pincode3 === "") {
    pincode3 = pincode1;
  }
  if (pincode4 === "") {
    pincode4 = pincode1;
  }
  if (pincode5 === "") {
    pincode5 = pincode1;
  }
  if (pincode6 === "") {
    pincode6 = pincode1;
  }
  if (pincode7 === "") {
    pincode7 = pincode1;
  }
  if (phone_numbers === null || phone_numbers === undefined) {
    phone_numbers = "9058222810";
  }
  const restrict_phones = phone_numbers.split(",");
  const zip1 = pincode1.split(","),
    zip2 = pincode2.split(","),
    zip3 = pincode3.split(","),
    zip4 = pincode4.split(","),
    zip5 = pincode5.split(","),
    zip6 = pincode6.split(","),
    zip7 = pincode7.split(",");
  const zipArrays = [zip1, zip2, zip3, zip4, zip5, zip6, zip7];
  const ShippingAddress = useShippingAddress();
  const changeAddress = useApplyShippingAddressChange();
  const email = useEmail(),
    phone = usePhone(),
    shippingPhone =
      ShippingAddress?.phone === undefined ? "" : ShippingAddress?.phone;

  async function changePreValues(key, value) {
    const attribute = await changeAttribute({
      type: "updateAttribute",
      key: `${key}`,
      value: `${value}`,
    });
    // console.log('attribute: ', attribute);
  }
  async function updateAddress(address) {
    const code = await changeAddress({
      type: "updateShippingAddress",
      address: address,
    });
    // console.log("code", code);
    if(code.type === "success") {
      changePreValues("first_name", "");
      changePreValues("phone", "");
    }
  }
  const zipcode = ShippingAddress?.zip;
  if (zipArrays.some((zipArray) => zipArray.includes(zipcode)) === false) {
    async function change() {
      const attribute = await changeAttribute({
        type: "updateAttribute",
        key: "prepaid",
        value: "false",
      });
      // console.log('attribute: ', attribute);
    }
    if (lastAttribute.length === 0 || lastAttribute[0]?.value === "true") {
      change();
    }
  } else {
    if (restrict_phones.includes(formatPhoneNumber(shippingPhone)) === true) {
      async function change() {
        const attribute = await changeAttribute({
          type: "updateAttribute",
          key: "prepaid",
          value: "false",
        });
        // console.log('attribute: ', attribute);
      }
      if (lastAttribute.length === 0 || lastAttribute[0]?.value === "true") {
        change();
      }
    } else {
      async function change() {
        const attribute = await changeAttribute({
          type: "updateAttribute",
          key: "prepaid",
          value: "true",
        });
        // console.log('attribute: ', attribute);
      }
      if (lastAttribute.length === 0 || lastAttribute[0]?.value === "false") {
        change();
        // console.log('l', lastAttribute[0]);
      }
    }
  }
  useEffect(() => {
    var address = {};
    if (Attributes.some((attribute) => attribute.key === "first_name")) {
      const name = Attributes.find(
        (attribute) => attribute.key === "first_name"
      );
      if (name.value !== "") {
        const firstName = name.value.split(" ")[0];
        const lastName = name.value.split(" ")[1];
        if (lastName !== "undefined" || firstName === lastName) {
          address.firstName = firstName;
        } else {
          address.firstName = firstName;
          address.lastName = lastName;
        }
      }
    }
    if (Attributes.some((attribute) => attribute.key === "phone")) {
      const phone = Attributes.find((attribute) => attribute.key === "phone");
      if (phone.value !== "") {
        address.phone = formatPhoneNumber(phone.value);
        if (formatPhoneNumber(phone.value).length === 10) {
          address.countryCode = "IN";
        } else if (formatPhoneNumber(phone.value).length === 9) {
          address.countryCode = "AE";
        }
      }
    }
    if (Object.keys(address).length !== 0) {
      updateAddress(address);
    }
  }, [Attributes]);
  useBuyerJourneyIntercept(({ canBlockProgress }) => {
    const regex = /^(?:\+91)?[6789][0-9]{4}([ ]?)[0-9]{5}$/;
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,12}$/i;
    const nameRegex = /^[A-Za-z]*$/;
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