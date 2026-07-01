import {
  BlockSpacer,
  BlockStack,
  Button,
  Image,
  InlineLayout,
  Modal,
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

// ---------- SPIN-THE-WHEEL ASSETS ----------
// FEMALE assets (current — green wheel)
const SPIN_WHEEL_STATIC_FEMALE =
  "https://cdn.shopify.com/s/files/1/0100/1622/7394/files/Wheel.png?v=1782819093";
const SPIN_WHEEL_GIF_FEMALE =
  "https://cdn.shopify.com/s/files/1/0100/1622/7394/files/spin_the_wheel_terracotta_1.gif?v=1782911559";
const SPIN_WHEEL_REWARD_FEMALE =
  "https://cdn.shopify.com/s/files/1/0100/1622/7394/files/Rectangle_34629420.png?v=1782819093";

// MALE assets — TODO: upload male versions and replace these URLs
const SPIN_WHEEL_STATIC_MALE =
  "https://cdn.shopify.com/s/files/1/0100/1622/7394/files/Frame_2147231224_2.png?v=1782910564"; // TODO: male static
const SPIN_WHEEL_GIF_MALE =
  "https://cdn.shopify.com/s/files/1/0100/1622/7394/files/spin_the_wheel_500.gif?v=1782910564"; // TODO: male gif
const SPIN_WHEEL_REWARD_MALE =
  "https://cdn.shopify.com/s/files/1/0100/1622/7394/files/Frame_2147231225_1.png?v=1782911765"; // TODO: male reward

const THANKYOU_VIDEO_LINK = "https://trayahealth.app.link/d0fLh8aweEb";

// How long the GIF plays before swapping to the reward image (ms).
const SPIN_DURATION_MS = 3000;

// Case-id prefixes eligible for the spin wheel
const SPIN_WHEEL_PREFIXES = ["1", "2","a", "b", "c", "d", "e", "f"];

function Attribution() {
  const attributes = useAttributes();
  const orderEventFired = useRef(false);

  // 'idle'    -> static wheel (whole image is tappable)
  // 'spinning'-> animated GIF playing
  // 'won'     -> reward image + Download App Now (whole image is tappable)
  const [spinState, setSpinState] = useState("idle");

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

  // ---------- AUTO SLOT USERS ----------
  const isAutoSlotMaleUser = isMale && !!caseId;
  const isFemaleAutoSlotUser = isFemale && !!caseId;

  const femaleAutoPrefixes = ["0", "1", "a", "b"];
  const femaleDefaultPrefixes = [
    "c", "d", "e", "f", "2", "3", "4", "5", "6", "7", "8", "9",
  ];

  const isAutoSlotUser = isAutoSlotMaleUser || isFemaleAutoSlotUser;

  const isFemaleAutoBanner =
    isFemale && !!casePrefix && femaleAutoPrefixes.includes(casePrefix);
  const isFemaleDefaultBanner =
    isFemale && !!casePrefix && femaleDefaultPrefixes.includes(casePrefix);

  // ---------- SPIN-THE-WHEEL AUDIENCE ----------
  // Both male AND female users whose caseId starts with a, b, c, d, e, or f.
  const showSpinWheel =
    (isMale || isFemale) &&
    !!caseId &&
    !!casePrefix &&
    SPIN_WHEEL_PREFIXES.includes(casePrefix);

  // ---------- GENDER-SPECIFIC ASSETS ----------
  const SPIN_WHEEL_STATIC = isMale ? SPIN_WHEEL_STATIC_MALE : SPIN_WHEEL_STATIC_FEMALE;
  const SPIN_WHEEL_GIF = isMale ? SPIN_WHEEL_GIF_MALE : SPIN_WHEEL_GIF_FEMALE;
  const SPIN_WHEEL_REWARD = isMale ? SPIN_WHEEL_REWARD_MALE : SPIN_WHEEL_REWARD_FEMALE;

  console.log("[SpinWheel DEBUG]", {
    gender,
    caseId,
    casePrefix,
    isMale,
    isFemale,
    showSpinWheel,
    allAttributes: attributes.map(a => ({ key: a.key, value: a.value })),
  });

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

  // ---------- SPIN HANDLER ----------
  const handleSpin = () => {
    if (spinState !== "idle") return;
    setSpinState("spinning");
    fireSlotEvent("spin_wheel_clicked", caseId, "");
    setTimeout(() => {
      setSpinState("won");
      fireSlotEvent("spin_wheel_reward_shown", caseId, "");
    }, SPIN_DURATION_MS);
  };

  // ---------- AUTO SLOT BOOKING ----------
  useEffect(() => {
    if (!isAutoSlotUser || !caseId) return;
    const autoBookSlot = async () => {
      try {
        const AUTH_HEADERS = {
          "Content-Type": "application/json",
          "Authorization": "Bearer d7ef603e-71ea-44a1-93f2-2bacd08c4a90",
        };
        const res = await fetch(
          `https://api.hav-g.in/v3/slots/direct/${caseId}?slotType=pc`,
          { method: "GET", headers: AUTH_HEADERS }
        );
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
    : isFemale && !!caseId
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

  // ---------- SPIN-WHEEL UI ----------
  const renderSpinWheel = () => {
    // STATE 3: WON — full reward image is tappable, opens app
    if (spinState === "won") {
      return (
        <Pressable to={THANKYOU_VIDEO_LINK}>
          <Image
            source={SPIN_WHEEL_REWARD}
            loading="eager"
            fit="contain"
            accessibilityDescription="You won 500 coins — download the app to claim"
          />
        </Pressable>
      );
    }

    // STATE 2: SPINNING — GIF is shown, not tappable
    if (spinState === "spinning") {
      return (
        <Image
          source={SPIN_WHEEL_GIF}
          loading="eager"
          fit="contain"
          accessibilityDescription="Spinning the wheel..."
        />
      );
    }

    // STATE 1: IDLE — full static wheel image (with baked-in button) is tappable
    return (
      <Pressable onPress={handleSpin}>
        <Image
          source={SPIN_WHEEL_STATIC}
          loading="eager"
          fit="contain"
          accessibilityDescription="Tap to spin the wheel"
        />
      </Pressable>
    );
  };

  // ---------- UI ----------
  return (
    <>
      {showSpinWheel ? (
        renderSpinWheel()
      ) : (
        <View
          inlineSize="fill"
          background="subdued"
          border="base"
          borderRadius="base"
        >
          <Pressable inlineAlignment="center" to={autoSlotLink}>
            <Image source={autoSlotBanner} loading="eager" fit="cover" />
          </Pressable>
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
            <Pressable
              inlineAlignment="center"
              to="https://trayahealth.app.link/xT3UrtZDvyb"
            >
              <Image source={DOWNLOAD_BANNER} loading="eager" fit="cover" />
            </Pressable>
          </View>
          <BlockSpacer />
        </>
      )}
    </>
  );
}