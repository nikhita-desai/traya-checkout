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

export default reactExtension(
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

  const caseId =
    attributes.find((attr) => attr.key === "caseid")?.value || null;

  // 🔒 Experiment condition
  const isExperimentUser =
    gender === "male" &&
    caseId &&
    /^[16789def]/i.test(caseId);

  // ----------------------------
  // BOOK A CALL BANNER
  // ----------------------------
  const bookCallBanner =
    isExperimentUser
      ? "https://cdn.shopify.com/s/files/1/0100/1622/7394/files/auto-slot-booking.webp?v=1769002102"
      : gender === "female"
      ? "https://cdn.shopify.com/s/files/1/0100/1622/7394/files/slot-booking-female.webp?v=1766578030"
      : banner_image ||
        "https://cdn.shopify.com/s/files/1/0699/2199/7058/files/Group_1000006344.png?v=1718089642";

  // ----------------------------
  // BOOK A CALL CLICK TARGET
  // ----------------------------
  const bookCallLink = isExperimentUser
    ? "https://trayahealth.app.link/t08ztsBwRZb" // app homepage / app flow
    : caseId
    ? `https://form.traya.health/pages/reschedule-slot/${caseId}?orderPlatform=shopify`
    : `https://form.traya.health/pages/reschedule-slot?orderPlatform=shopify`;

  // ----------------------------
  // APP DOWNLOAD (UNCHANGED)
  // ----------------------------
  const downloadBanner =
    gender === "female"
      ? "https://cdn.shopify.com/s/files/1/0100/1622/7394/files/final_app_download.gif?v=1766412635"
      : "https://cdn.shopify.com/s/files/1/0100/1622/7394/files/Group_102353309_1.png";

  const downloadLink = "https://trayahealth.app.link/xT3UrtZDvyb";

  return (
    <>
      {/* BOOK A CALL */}
      <View inlineSize="fill" background="subdued" border="base" borderRadius="base">
        <InlineLayout columns="fill">
          <Pressable inlineAlignment="center" to={bookCallLink}>
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

      {/* DOWNLOAD APP — NO CHANGE */}
      <View inlineSize="fill" background="subdued" border="base" borderRadius="base">
        <InlineLayout columns="fill">
          <Pressable inlineAlignment="center" to={downloadLink}>
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
