import {
  BlockSpacer,
  Image,
  InlineLayout,
  Pressable,
  reactExtension,
  useAttributes,
  useSettings,
  View,
  Banner,
  Text,
  SkeletonText,
} from "@shopify/ui-extensions-react/checkout";
import { useEffect, useState } from "react";

export default reactExtension(
  "purchase.thank-you.block.render",
  () => <Attribution />
);

function Attribution() {
  const { banner_image } = useSettings();
  const attributes = useAttributes();
  
  const [bookingStatus, setBookingStatus] = useState("idle");
  const [bookingMessage, setBookingMessage] = useState("");

  const gender =
    attributes
      .find((attr) => attr.key === "user__gender")
      ?.value?.toLowerCase() || null;
 
  const caseId =
    attributes.find((attr) => attr.key === "caseid")?.value || null;

  const isExperimentUser =
    gender === "male" &&
    caseId &&
    /^[16789def]/i.test(caseId);

  // Format slot time for display
  const formatSlotTime = (slotTime) => {
    const date = new Date(slotTime);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  

  function fireClinicEvent(eventName, caseID) {
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
          },
        },
        caseId: caseID,
      }),
    });
  }

  // AUTO SLOT BOOKING
  useEffect(() => {
    if (!isExperimentUser || !caseId) return;

    const autoBookSlot = async () => {
      setBookingStatus("loading");
      const AUTH_HEADERS = {
        "Content-Type": "application/json",
        "Authorization": "Bearer d7ef603e-71ea-44a1-93f2-2bacd08c4a90",
      };

      try {
        // Step 1: Fetch available slots
        const slotsResponse = await fetch(
          `https://api.hav-g.in/v3/slots/direct/${caseId}?slotType=pc`,
          {
            method: "GET",
            headers: AUTH_HEADERS,
          }
        );

        if (!slotsResponse.ok) {
          throw new Error("Failed to fetch slots");
        }

        const slotsData = await slotsResponse.json();
        
        // Step 2: Find first available slot where count >= 1
        const availableSlot = slotsData.find(slot => slot.slots.count >= 1);

        if (!availableSlot) {
          setBookingStatus("error");
          setBookingMessage("No available slots found. Please book manually using the link below.");
          return;
        }

        // Step 3: Prepare booking payload (without session_id)
        const bookingPayload = {
          case_id: caseId,
          slot_id: availableSlot.id,
          slots: {
            count: availableSlot.slots.count,
            reps: availableSlot.slots.reps
          },
          order_related: false,
          is_rescheduling: true,
          from_crm: false,
        };

        // Step 4: Book the slot
        const bookingResponse = await fetch(
          "https://api.hav-g.in/v3/slots/slot-booking", 
          {
            method: "POST",
            headers: AUTH_HEADERS,
            body: JSON.stringify(bookingPayload),
          }
        );

        if (!bookingResponse.ok) {
          throw new Error("Failed to book slot");
        }

        const bookingData = await bookingResponse.json();

        setBookingStatus("success");
        setBookingMessage(`Your consultation is scheduled for ${formatSlotTime(availableSlot.slotTime)}`);
        
      } catch (error) {
        console.error("Auto-booking error:", error);
        setBookingStatus("error");
        setBookingMessage("Unable to auto-book your slot. Please use the link below to book manually.");
      }
    };

    autoBookSlot();
  }, [isExperimentUser, caseId]);

  const bookCallBanner =
    isExperimentUser
      ? "https://cdn.shopify.com/s/files/1/0100/1622/7394/files/auto-slot-booking.webp?v=1769002102"
      : gender === "female"
      ? "https://cdn.shopify.com/s/files/1/0100/1622/7394/files/slot-booking-female.webp?v=1766578030"
      : banner_image ||
        "https://cdn.shopify.com/s/files/1/0699/2199/7058/files/Group_1000006344.png?v=1718089642";

  const bookCallLink = isExperimentUser
    ? "https://trayahealth.app.link/d0fLh8aweEb"
    : caseId
    ? `https://form.traya.health/pages/reschedule-slot/${caseId}?orderPlatform=shopify`
    : `https://form.traya.health/pages/reschedule-slot?orderPlatform=shopify`;

  const downloadBanner =
    gender === "female"
      ? "https://cdn.shopify.com/s/files/1/0100/1622/7394/files/final_app_download.gif?v=1766412635"
      : "https://cdn.shopify.com/s/files/1/0100/1622/7394/files/Group_102353309_1.png";

  const downloadLink = "https://trayahealth.app.link/xT3UrtZDvyb";

  return (
    <>
      {/* AUTO-BOOKING STATUS */}
      {/* {isExperimentUser && bookingStatus !== "idle" && (
        <>
          {bookingStatus === "loading" && (
            <View border="base" padding="base" borderRadius="base">
              <Text size="medium" emphasis="bold">Booking your consultation slot...</Text>
              <BlockSpacer spacing="extraTight" />
              <SkeletonText />
            </View>
          )}

          {bookingStatus === "success" && (
            <Banner status="success" title="Slot Booked! ✓">
              {bookingMessage}
            </Banner>
          )}

          {bookingStatus === "error" && (
            <Banner status="warning" title="Booking Notice">
              {bookingMessage}
            </Banner>
          )}
          
          <BlockSpacer />
        </>
      )} */}

      {/* BOOK A CALL */}
      <View inlineSize="fill" background="subdued" border="base" borderRadius="base">
        <InlineLayout columns="fill">
          <Pressable
            inlineAlignment="center"
            to={bookCallLink}
            onPress={() => {
              if (caseId) {
                fireClinicEvent(
                  "webshopify_goto_app_now_click",
                  caseId
                );
              }
            }}>
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

      {/* DOWNLOAD APP */}
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