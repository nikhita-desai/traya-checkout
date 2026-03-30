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
import { useEffect, useRef } from "react";

export default reactExtension(
  "purchase.thank-you.block.render",
  () => <Attribution />
);

// Dev: 'https://public-zxhj2.dev.hav-g.in/', 
// DEV: 'https://api.dev.hav-g.in/', 
// DEV:{ "Authorization": "Bearer e2623576-930b-48b6-81e2-a3cb5e37f47d" }, 
// PROD: 'https://public-jgfas325.hav-g.in/' 
// PROD: 'https://api.hav-g.in/' }
// PROD: { "Authorization": "Bearer d7ef603e-71ea-44a1-93f2-2bacd08c4a90" } }

function Attribution() {
  const { banner_image } = useSettings();
  const attributes = useAttributes();
  const orderEventFired = useRef(false);

  const gender =
    attributes.find((attr) => attr.key === "user__gender")?.value?.toLowerCase() || null;

  const caseId =
    attributes.find((attr) => attr.key === "caseid")?.value || null;

  const hairStage =
    attributes.find((attr) => attr.key === "hair_Stage")?.value?.toLowerCase() || null;

  const casePrefix = caseId?.charAt(0)?.toLowerCase();

  const isMale = gender === "male";

  // ✅ NEW EXPERIMENT LOGIC (2–9)
  const experimentPrefixes = ["2","3","4","5","6","7","8","9"];

  const isExperimentUser =
    casePrefix &&
    experimentPrefixes.includes(casePrefix);

  // ---------- AUTO SLOT USERS ----------
  const isAutoSlotMaleUser = isMale;

  const femaleAutoPrefixes = ["0","1","a","b"];

  const isFemaleAutoSlotUser =
    gender === "female" &&
    casePrefix &&
    femaleAutoPrefixes.includes(casePrefix) &&
    (hairStage === "hair thinning" || hairStage === "side thinning");

  const isAutoSlotUser = isAutoSlotMaleUser || isFemaleAutoSlotUser;

  // ---------- EVENTS ----------
  function fireSlotEvent(eventName, caseID, referrer = "") {
    fetch("https://public-jgfas325.hav-g.in/eventMoengageWeb", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer d7ef603e-71ea-44a1-93f2-2bacd08c4a90"
      },
      body: JSON.stringify({
        eventName,
        eventAttributes: {
          generalAttributes: {
            platform: "web_shopify",
            domain: "traya.health",
            language: "English",
            previous_page: referrer
          },
        },
        caseId: caseID,
      }),
    });
  }

  // ---------- AUTO SLOT BOOKING ----------
  useEffect(() => {
    if (!isAutoSlotUser || !caseId) return;

    const autoBookSlot = async () => {
      try {
        const AUTH_HEADERS = {
          "Content-Type": "application/json",
          "Authorization": "Bearer d7ef603e-71ea-44a1-93f2-2bacd08c4a90",
        };

        const slotsResponse = await fetch(
          `https://api.hav-g.in/v3/slots/direct/${caseId}?slotType=pc`,
          { method: "GET", headers: AUTH_HEADERS }
        );

        const slotsData = await slotsResponse.json();
        const availableSlot = slotsData.find(s => s.slots?.count >= 1);
 
        if (!availableSlot) return;

        const bookingPayload = {
          case_id: caseId,
          slot_id: availableSlot.id,
          slots: availableSlot.slots,
          order_related: false,
          is_rescheduling: true,
          from_crm: false,
          is_autoSlotBooked: true
        };

        await fetch("https://api.hav-g.in/v3/slots/slot-booking", {
          method: "POST",
          headers: AUTH_HEADERS,
          body: JSON.stringify(bookingPayload),
        });

      } catch (e) {
        console.error("Auto-booking error:", e);
      }
    };

    autoBookSlot();
  }, [isAutoSlotUser, caseId]);

  // ---------- ORDER EVENT ----------
  useEffect(() => {
    if (!caseId || gender !== "male") return;
    if (orderEventFired.current) return;

    orderEventFired.current = true;

    const previousUrl =
      typeof document !== "undefined" ? document.referrer : "";

    fireSlotEvent("order_placed", caseId, previousUrl);

  }, [caseId, gender]);

  const isUnknownUser =
    !gender &&
    !caseId &&
    !hairStage;

  // ---------- BANNERS ----------
  const CONTROL_BANNER =
    "https://cdn.shopify.com/s/files/1/0100/1622/7394/files/control-banner.webp?v=1774875867";

  const VARIATION_BANNER =
    "https://cdn.shopify.com/s/files/1/0100/1622/7394/files/variation-banner.webp?v=1774875936";

  const FALLBACK_BANNER =
    "https://cdn.shopify.com/s/files/1/0100/1622/7394/files/Group_102353309_1.png";

  // ✅ FINAL BANNER LOGIC
  const autoSlotBanner =
    isUnknownUser
      ? FALLBACK_BANNER
      : isExperimentUser
      ? VARIATION_BANNER
      : CONTROL_BANNER;

  // ---------- LINKS ----------
  const autoSlotLink =
    isUnknownUser
      ? "https://trayahealth.app.link/xT3UrtZDvyb"
      : isAutoSlotUser
      ? "https://trayahealth.app.link/d0fLh8aweEb"
      : caseId
      ? `https://form.traya.health/pages/reschedule-slot/${caseId}?orderPlatform=shopify`
      : `https://form.traya.health/pages/reschedule-slot?orderPlatform=shopify`;

  const clickEventName = "webshopify_goto_app_now_click";

  // ---------- UI ----------
  return (
    <>
      <View inlineSize="fill" background="subdued" border="base" borderRadius="base">
        <InlineLayout columns="fill">
          <Pressable
            inlineAlignment="center"
            to={autoSlotLink}
            onPress={() => {
              if (caseId && isAutoSlotUser) {
                fireSlotEvent(clickEventName, caseId);
              }
            }}>
            <Image source={autoSlotBanner} loading="eager" fit="cover" />
          </Pressable>
        </InlineLayout>
      </View>

      <BlockSpacer />
    </>
  );
}