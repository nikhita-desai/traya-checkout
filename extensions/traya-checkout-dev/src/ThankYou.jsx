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
  const { banner_image } = useSettings();
  const attributes = useAttributes();
  const genderAttr = attributes.find((attr) => attr.key === "user__gender");
  const gender = genderAttr?.value?.toLowerCase();

  const bannerImage2 =
    gender === "female"
      ? "https://cdn.shopify.com/s/files/1/0100/1622/7394/files/Frame_2147227614.png?v=1761295389"
      : "https://cdn.shopify.com/s/files/1/0100/1622/7394/files/Group_102353309_1.png";

  const bannerImage1 =
    banner_image ||
    "https://cdn.shopify.com/s/files/1/0699/2199/7058/files/Group_1000006344.png?v=1718089642";

  const lastAttribute = attributes.find((attr) => attr.key === "caseid");
  const rescheduleUrl = lastAttribute
    ? `https://form.traya.health/pages/reschedule-slot/${lastAttribute.value}?orderPlatform=shopify`
    : `https://form.traya.health/pages/reschedule-slot?orderPlatform=shopify`;

  return (
    <>
      {/* Book a call banner */}
      <View
        inlineSize="fill"
        background="subdued"
        border="base"
        borderRadius="base"
      >
        <InlineLayout columns="fill">
          <Pressable inlineAlignment="center" to={rescheduleUrl}>
            <Image
              source={bannerImage1}
              loading="eager"
              fit="cover"
              accessibilityRole="Book a call"
              accessibilityDescription="Book a call"
            />
          </Pressable>
        </InlineLayout>
      </View>

      <BlockSpacer />

      {/* Download App banner (gender-based) */}
      <View
        inlineSize="fill"
        background="subdued"
        border="base"
        borderRadius="base"
      >
        <BlockSpacer />
        <InlineLayout columns="fill">
          <Pressable
            inlineAlignment="center"
            to="https://trayahealth.app.link/xT3UrtZDvyb"
          >
            <Image
              source={bannerImage2}
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
