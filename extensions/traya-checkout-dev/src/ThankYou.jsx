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
import { useEffect } from "react";
import { useRef } from "react";

export default reactExtension(
  "purchase.thank-you.block.render",
  () => <Attribution />
);

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

  // ---------- EXPERIMENT PREFIX ----------
  const newBannerPrefixes = ["1","6","7","8","9","d","e","f"];

  const isNewBannerExperimentUser =
    isMale &&
    casePrefix &&
    newBannerPrefixes.includes(casePrefix);

  // ---------- AUTO SLOT USERS ----------
  const isAutoSlotMaleUser = isMale;

  const femaleAutoPrefixes = ["0","1","a","b"];

  const isFemaleAutoSlotUser =
    gender === "female" &&
    casePrefix &&
    femaleAutoPrefixes.includes(casePrefix) &&
    (hairStage === "hair thinning" || hairStage === "side thinning");

  const isAutoSlotUser = isAutoSlotMaleUser || isFemaleAutoSlotUser;

  // Dev: 'https://public-zxhj2.dev.hav-g.in/',
  // DEV: 'https://api.dev.hav-g.in/', 
  // DEV:{ "Authorization": "Bearer e2623576-930b-48b6-81e2-a3cb5e37f47d" }, 

  // PROD: 'https://public-jgfas325.hav-g.in/' 
  // PROD: 'https://api.hav-g.in/' } 
  // PROD: { "Authorization": "Bearer d7ef603e-71ea-44a1-93f2-2bacd08c4a90" } }
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
  // ---------- BANNERS / LINKS ----------
  const DEFAULT_AUTO_BANNER =
    "https://cdn.shopify.com/s/files/1/0100/1622/7394/files/male_experiment1v2.webp?v=1773218398";
  const FEMALE_AUTO_BANNER =
    "https://cdn.shopify.com/s/files/1/0100/1622/7394/files/male_experiment1.webp?v=1772517436";
  const NEW_EXPERIMENT_BANNER =
    "https://cdn.shopify.com/s/files/1/0100/1622/7394/files/male-experiment2.webp?v=1772517413";

  const FEMALE_BANNER =
    "https://cdn.shopify.com/s/files/1/0100/1622/7394/files/slot-booking-female.webp?v=1766578030";
    
  const FALLBACK_BANNER =
  "https://cdn.shopify.com/s/files/1/0100/1622/7394/files/Group_102353309_1.png";

  const autoSlotBanner =
    isUnknownUser
      ? FALLBACK_BANNER
      : isNewBannerExperimentUser
      ? NEW_EXPERIMENT_BANNER
      : isFemaleAutoSlotUser
      ? FEMALE_AUTO_BANNER
      : isAutoSlotMaleUser
      ? DEFAULT_AUTO_BANNER
      : gender === "female"
      ? FEMALE_BANNER
      : banner_image;

  const autoSlotLink =
    isUnknownUser
      ? "https://trayahealth.app.link/xT3UrtZDvyb"
      : isAutoSlotUser
      ? "https://trayahealth.app.link/d0fLh8aweEb"
      : caseId
      ? `https://form.traya.health/pages/reschedule-slot/${caseId}?orderPlatform=shopify`
      : `https://form.traya.health/pages/reschedule-slot?orderPlatform=shopify`;

  const clickEventName =
    isNewBannerExperimentUser
      ? "webshopify_goto_app_now_click"
      : "webshopify_goto_app_now_click";

  const downloadBanner =
    gender === "female"
      ? "https://cdn.shopify.com/s/files/1/0100/1622/7394/files/final_app_download.gif?v=1766412635"
      : "https://cdn.shopify.com/s/files/1/0100/1622/7394/files/Group_102353309_1.png";

  // ---------- UI ----------
  return (
    <>
      {/* AUTO SLOT BANNER (ALL MALE + FEMALE AUTO) */}
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

      {/* DOWNLOAD */}
      {/* {gender !== "male" && (
        <View inlineSize="fill" background="subdued" border="base" borderRadius="base">
          <InlineLayout columns="fill">
            <Pressable inlineAlignment="center" to="https://trayahealth.app.link/xT3UrtZDvyb">
              <Image source={downloadBanner} loading="eager" fit="cover" />
            </Pressable>
          </InlineLayout>
        </View>
      )} */}
    </>
  );
}