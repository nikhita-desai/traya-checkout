import {
  BlockSpacer,
  Image,
  InlineLayout,
  Pressable,
  reactExtension,
  useAttributes,
  View,
} from "@shopify/ui-extensions-react/checkout";
import { useEffect, useRef } from "react";

export default reactExtension(
  "purchase.thank-you.block.render",
  () => <Attribution />
);

function Attribution() {
  const attributes = useAttributes();
  const orderEventFired = useRef(false);

  // ✅ SAFE ATTRIBUTE EXTRACTION
  const rawGender =
    attributes.find((attr) => attr.key === "user__gender")?.value || "";

  const gender = rawGender.toLowerCase().trim();

  const caseId =
    attributes.find((attr) => attr.key === "caseid")?.value || null;

  const hairStage =
    attributes.find((attr) => attr.key === "hair_Stage")?.value?.toLowerCase() || null;

  const casePrefix = caseId?.charAt(0)?.toLowerCase();

  const isMale = gender === "male";
  const isFemale = gender === "female" || gender === "f";

  // ✅ EXPERIMENT USERS
  const experimentPrefixes = ["2","3","4","5","6","7","8","9"];
  const isExperimentUser =
    casePrefix && experimentPrefixes.includes(casePrefix);

  // ---------- AUTO SLOT USERS ----------

  // ⚠️ IMPORTANT FIX: DO NOT MAKE ALL MALES AUTO SLOT
  const isAutoSlotMaleUser = false; // 👈 FIXED (previous bug)

  const femaleAutoPrefixes = ["0","1","a","b"];
  const isFemaleAutoSlotUser =
    isFemale &&
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

  // ---------- AUTO SLOT BOOKING (SAFE) ----------
  useEffect(() => {
    if (!isAutoSlotUser || !caseId) return;

    const autoBookSlot = async () => {
      try {
        const AUTH_HEADERS = {
          "Content-Type": "application/json",
          "Authorization": "Bearer e2623576-930b-48b6-81e2-a3cb5e37f47d",
        };

        const res = await fetch(
          `https://api.dev.hav-g.in/v3/slots/direct/${caseId}?slotType=pc`,
          { method: "GET", headers: AUTH_HEADERS }
        );

        if (!res.ok) return; // ✅ prevent crash

        const data = await res.json();
        const slotsArray = Array.isArray(data) ? data : data?.data || [];

        const availableSlot = slotsArray.find(s => s?.slots?.count >= 1);
        if (!availableSlot) return;

        await fetch("https://api.dev.hav-g.in/v3/slots/slot-booking", {
          method: "POST",
          headers: AUTH_HEADERS,
          body: JSON.stringify({
            case_id: caseId,
            slot_id: availableSlot.id,
            slots: availableSlot.slots,
            order_related: false,
            is_rescheduling: true,
            from_crm: false,
            is_autoSlotBooked: true
          }),
        });

      } catch (e) {
        console.error("Auto-booking error:", e);
      }
    };

    autoBookSlot();
  }, [isAutoSlotUser, caseId]);

  // ---------- ORDER EVENT ----------
  useEffect(() => {
    if (!caseId || !isMale) return;
    if (orderEventFired.current) return;

    orderEventFired.current = true;

    fireSlotEvent(
      "order_placed",
      caseId,
      typeof document !== "undefined" ? document.referrer : ""
    );

  }, [caseId, isMale]);

  // ---------- USER STATE ----------
  const isUnknownUser = !gender && !caseId && !hairStage;

  // ✅ FIXED CONDITION (CRITICAL)
  const showFemaleDownloadBanner = isFemale;

  // ---------- BANNERS ----------
  const CONTROL_BANNER = "https://cdn.shopify.com/s/files/1/0100/1622/7394/files/control-banner.webp?v=1774875867";
  const VARIATION_BANNER = "https://cdn.shopify.com/s/files/1/0100/1622/7394/files/variation-banner.webp?v=1774875936";
  const FALLBACK_BANNER = "https://cdn.shopify.com/s/files/1/0100/1622/7394/files/Group_102353309_1.png";
  const FEMALE_AUTO_BANNER = "https://cdn.shopify.com/s/files/1/0100/1622/7394/files/auto-slot-booking.webp?v=1769002102";
  const DOWNLOAD_BANNER = "https://cdn.shopify.com/s/files/1/0100/1622/7394/files/final_app_download.gif?v=1766412635";

  // ✅ FIXED PRIORITY
  const autoSlotBanner =
    isUnknownUser
      ? FALLBACK_BANNER
      : isFemaleAutoSlotUser
      ? FEMALE_AUTO_BANNER
      : isMale && isExperimentUser
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

  // ---------- UI ----------
  return (
    <>
      {/* MAIN BANNER */}
      <View inlineSize="fill" background="subdued" border="base" borderRadius="base">
        <InlineLayout columns="fill">
          <Pressable inlineAlignment="center" to={autoSlotLink}>
            <Image source={autoSlotBanner} loading="eager" fit="cover" />
          </Pressable>
        </InlineLayout>
      </View>

      <BlockSpacer />

      {/* ✅ FEMALE DOWNLOAD BANNER */}
      {showFemaleDownloadBanner && (
        <>
          <View inlineSize="fill" background="subdued" border="base" borderRadius="base">
            <InlineLayout columns="fill">
              <Pressable
                inlineAlignment="center"
                to="https://trayahealth.app.link/xT3UrtZDvyb"
              >
                <Image source={DOWNLOAD_BANNER} loading="eager" fit="cover" />
              </Pressable>
            </InlineLayout>
          </View>

          <BlockSpacer />
        </>
      )}
    </>
  );
}