import {
  BlockSpacer,
  Image,
  InlineLayout,
  Pressable,
  reactExtension,
  useAttributes,
  useSettings,
  View,
} from "@shopify/ui-extensions-react/checkout";

const thankYouBlock = reactExtension("purchase.thank-you.block.render", () => (
  <Attribution />
));
export { thankYouBlock };

function Attribution() {
  var { banner_image, banner_image2 } = useSettings();
  if (
    banner_image === "" ||
    banner_image === undefined ||
    banner_image === null
  ) {
    banner_image =
      "https://cdn.shopify.com/s/files/1/0699/2199/7058/files/Group_1000006344.png?v=1718089642";
  }
  if (
    banner_image2 === "" ||
    banner_image2 === undefined ||
    banner_image2 === null
  ) {
    banner_image2 =
      "https://cdn.shopify.com/s/files/1/0100/1622/7394/files/Group_102353309_1.png";
  }
  
  const Attributes = useAttributes();
  const lastAttribute = Attributes.filter((attribute) => {
    if (attribute.key === "caseid") {
      return attribute;
    }
  });

  return (
    <>
      <View
        inlineSize="fill"
        background="subdued"
        border="base"
        borderRadius="base"
      >
        <InlineLayout columns={"fill"}>
          <Pressable
            inlineAlignment={`center`}
            to={`${
              lastAttribute.length === 0
                ? `https://form.traya.health/pages/reschedule-slot?orderPlatform=shopify`
                : `https://form.traya.health/pages/reschedule-slot/${lastAttribute[0].value}?orderPlatform=shopify`
            }`}
          >
            <Image
              source={banner_image}
              loading="eager"
              fit="cover"
              accessibilityRole="Book a call"
              accessibilityDescription="Book a call"
            />
          </Pressable>
        </InlineLayout>
      </View>
      <BlockSpacer />
      <View
        inlineSize="fill"
        background="subdued"
        border="base"
        borderRadius="base"
      >
        <BlockSpacer />
        <InlineLayout columns={"fill"}>
          <Pressable
            inlineAlignment={`center`}
            to="https://trayahealth.app.link/xT3UrtZDvyb"
          >
            <Image
              source={banner_image2}
              loading="eager"
              fit="cover"
              accessibilityRole="Download App"
              accessibilityDescription="Download App"
            />
          </Pressable>
        </InlineLayout>
      </View>
    </>
  );
}
