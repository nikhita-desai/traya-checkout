import {
  BlockSpacer,
  BlockStack,
  Image,
  InlineLayout,
  Pressable,
  Text,
  View,
  reactExtension,
  useAttributes,
  useStorage,
} from "@shopify/ui-extensions-react/checkout";
import { useEffect, useRef, useState } from "react";

export default reactExtension(
  "purchase.thank-you.block.render",
  () => <Attribution />
);

const RS50_BANNER = "https://cdn.shopify.com/s/files/1/0100/1622/7394/files/Background_Border.webp?v=1782299412";
const RS50_APP_LINK = "https://trayahealth.app.link/d0fLh8aweEb";

function Attribution() {
  const attributes = useAttributes();
  const orderEventFired = useRef(false);
  const rawGender =
    attributes.find((attr) => attr.key === "user__gender")?.value || "";

  const gender = rawGender.toLowerCase().trim();

  const caseId =
    attributes.find((attr) => attr.key === "caseid")?.value || null;

  const hairStage =
    attributes.find((attr) => attr.key === "hair_Stage")?.value?.toLowerCase() ||
    null;

  const casePrefix = caseId?.charAt(0)?.toLowerCase();

  const isMale = gender === "male";
  const isFemale = gender === "female" || gender === "f";
  const experimentPrefixes = ["2", "3", "4", "5", "6", "7", "8", "9"];
  const isExperimentUser =
    casePrefix && experimentPrefixes.includes(casePrefix);

  // ---------- Rs.50 APP-INSTALL EXPERIMENT (MALE, O1, web_shopify) ----------
  const rs50ExpPrefixes = ["0", "1", "a", "b", "c", "d", "e", "f"];
  const isRs50Experiment =
    isMale && !!caseId && !!casePrefix && rs50ExpPrefixes.includes(casePrefix);

  // ---------- AUTO SLOT USERS ----------
  const isAutoSlotMaleUser = isMale && !!caseId;
  const isFemaleAutoSlotUser = isFemale && !!caseId; // slot booking: all females
  const femaleAutoPrefixes = ["0", "1", "a", "b"];
  const femaleDefaultPrefixes = [
    "c", "d", "e", "f", "2", "3", "4", "5", "6", "7", "8", "9",
  ];

  const isAutoSlotUser = isAutoSlotMaleUser || isFemaleAutoSlotUser;

  // banner-only splits
  const isFemaleAutoBanner =
    isFemale && !!casePrefix && femaleAutoPrefixes.includes(casePrefix);
  const isFemaleDefaultBanner =
    isFemale && !!casePrefix && femaleDefaultPrefixes.includes(casePrefix);

  // ---------- EVENTS ----------
  function fireSlotEvent(eventName, caseID, referrer = "") {
    fetch("https://public-jgfas325.hav-g.in/eventMoengageWeb", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer d7ef603e-71ea-44a1-93f2-2bacd08c4a90",
      },
      body: JSON.stringify({
        eventName,
        eventAttributes: {
          generalAttributes: {
            platform: "web_shopify",
            domain: "traya.health",
            language: "English",
            previous_page: referrer,
          },
        },
        caseId: caseID,
      }),
    });
  }

  // ---------- AUTO SLOT BOOKING (SAFE) ----------
  // Unchanged: still books the onboarding call for all males w/ caseId.
  useEffect(() => {
    if (!isAutoSlotUser || !caseId) return;

    const autoBookSlot = async () => {
      try {
        // PROD Start
        const AUTH_HEADERS = {
          "Content-Type": "application/json",
          "Authorization": "Bearer d7ef603e-71ea-44a1-93f2-2bacd08c4a90",
        };

        const res = await fetch(
          `https://api.hav-g.in/v3/slots/direct/${caseId}?slotType=pc`,
          { method: "GET", headers: AUTH_HEADERS }
        );
        // PROD End

        // DEV Start
        // const AUTH_HEADERS = {
        //   "Content-Type": "application/json",
        //   "Authorization": "Bearer e2623576-930b-48b6-81e2-a3cb5e37f47d",
        // };

        // const res = await fetch(
        //   `https://api.dev.hav-g.in/v3/slots/direct/${caseId}?slotType=pc`,
        //   { method: "GET", headers: AUTH_HEADERS }
        // );
        // DEV End

        if (!res.ok) return;

        const data = await res.json();
        const slotsArray = Array.isArray(data) ? data : data?.data || [];

        const availableSlot = slotsArray.find((s) => s?.slots?.count >= 1); 
        if (!availableSlot) return;

        await fetch("https://api.hav-g.in/v3/slots/slot-booking", {
          method: "POST",
          headers: AUTH_HEADERS,
          body: JSON.stringify({
            case_id: caseId,
            slot_id: availableSlot.id,
            slots: availableSlot.slots,
            order_related: false,
            is_rescheduling: true,
            from_crm: false,
            is_autoSlotBooked: true, 
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

    fireSlotEvent("order_placed", caseId, "");
  }, [caseId, isMale]);

  // ---------- USER STATE ----------
  const isUnknownUser = !gender && !caseId && !hairStage;
  const showFemaleDownloadBanner =
    isFemale && !isFemaleAutoSlotUser && !isFemaleDefaultBanner;

  // ---------- BANNERS ----------
  const CONTROL_BANNER =
    "https://cdn.shopify.com/s/files/1/0100/1622/7394/files/control-banner.webp?v=1774875867";
  const VARIATION_BANNER =
    "https://cdn.shopify.com/s/files/1/0100/1622/7394/files/control-banner.webp?v=1774875867";
  const FALLBACK_BANNER =
    "https://cdn.shopify.com/s/files/1/0100/1622/7394/files/Group_102353309_1.png";
  const DOWNLOAD_BANNER =
    "https://cdn.shopify.com/s/files/1/0100/1622/7394/files/final_app_download.gif?v=1766412635";
  const FEMALE_NEW_BANNER =
    "https://cdn.shopify.com/s/files/1/0100/1622/7394/files/new-banner-female-100.webp?v=1777361004";

  const autoSlotBanner = isUnknownUser
    ? FALLBACK_BANNER
    : isFemale && !!caseId // all females with any caseId -> new banner
    ? FEMALE_NEW_BANNER
    : isMale && !isAutoSlotUser && isExperimentUser
    ? VARIATION_BANNER
    : CONTROL_BANNER;

  // ---------- LINKS ----------
  const SPECIAL_CASE_ID = "e6145b3a-3ab1-4653-ba3c-2a71a87169ca";

  const autoSlotLink =
    caseId === SPECIAL_CASE_ID
      ? "https://trayahealth.app.link/"
      : isUnknownUser
      ? "https://trayahealth.app.link/xT3UrtZDvyb"
      : isAutoSlotUser
      ? "https://trayahealth.app.link/d0fLh8aweEb"
      : caseId
      ? `https://form.traya.health/pages/reschedule-slot/${caseId}?orderPlatform=shopify`
      : `https://form.traya.health/pages/reschedule-slot?orderPlatform=shopify`;

  // ---------- UI ----------
  return (
    <>
      {/* <BlockSpacer /> */}

      {isRs50Experiment ? (
        // -------- EXPERIMENT GROUP: Rs.50 app-install card --------
        <View
          inlineSize="fill"
          background="subdued"
          border="base"
          borderRadius="base">
          <BlockStack spacing="none">        
            <InlineLayout columns="fill">
              <Pressable inlineAlignment="center" to={RS50_APP_LINK}>
                <Image source={RS50_BANNER} loading="eager" fit="cover" />
              </Pressable>
            </InlineLayout>
          </BlockStack>
        </View>
      ) : (
        // -------- EVERYONE ELSE: existing banner (unchanged) --------
        <View
          inlineSize="fill"
          background="subdued"
          border="base"
          borderRadius="base"
        >
          <InlineLayout columns="fill">
            <Pressable inlineAlignment="center" to={autoSlotLink}>
              <Image source={autoSlotBanner} loading="eager" fit="cover" />
            </Pressable>
          </InlineLayout>
        </View>
      )}

      <BlockSpacer />

      {showFemaleDownloadBanner && (
        <>
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