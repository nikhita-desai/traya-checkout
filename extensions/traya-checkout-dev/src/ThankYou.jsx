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

export const thankYouBlock = reactExtension(
  "purchase.thank-you.block.render",
  () => <Attribution />
);

function Attribution() {
  const { banner_image } = useSettings();
  const attributes = useAttributes();

  const gender =
    attributes
      .find((attr) => attr.key === "user__gender")
      ?.value?.toLowerCase() || null;

  const caseId = attributes.find((attr) => attr.key === "caseid")?.value;

  const rescheduleUrl = caseId
    ? `https://form.traya.health/pages/reschedule-slot/${caseId}?orderPlatform=shopify`
    : `https://form.traya.health/pages/reschedule-slot?orderPlatform=shopify`;

  const bookCallBanner =
    banner_image ||
    "https://cdn.shopify.com/s/files/1/0699/2199/7058/files/Group_1000006344.png?v=1718089642";
  
  const downloadBanner =
    gender === "female"
      ? "https://cdn.shopify.com/s/files/1/0100/1622/7394/files/final_app_download.gif?v=1766412635"
      : "https://cdn.shopify.com/s/files/1/0100/1622/7394/files/Group_102353309_1.png";

  return (
    <>
      {/* BOOK A CALL — ALWAYS */}
      <View inlineSize="fill" background="subdued" border="base" borderRadius="base">
        <InlineLayout columns="fill">
          <Pressable inlineAlignment="center" to={rescheduleUrl}>
            <Image
              source={bookCallBanner}
              loading="eager"
              fit="cover"
              accessibilityRole="image"
              accessibilityDescription="Book a call"
            />
          </Pressable>
        </InlineLayout>
      </View>

      <BlockSpacer />

      {/* DOWNLOAD APP — ALWAYS (image changes by gender) */}
      <View
        inlineSize="fill"
        background="subdued"
        border="base"
        borderRadius="base"
      >
        <InlineLayout columns="fill">
          <Pressable
            inlineAlignment="center"
            to="https://trayahealth.app.link/xT3UrtZDvyb"
          >
            <Image
              source={downloadBanner}
              loading="eager"
              fit="cover"
              accessibilityRole="image"
              accessibilityDescription="Download App"
            />
          </Pressable>
        </InlineLayout>
      </View>
    </>
  );
}
