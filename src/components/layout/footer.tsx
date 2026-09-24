"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  LOGOS,
  ICONS,
  contacts as defaultContacts,
  footerSocialIcons,
  readyToAssist,
  mainMenu,
} from "@/constants/storefront";
import { ContactCard, ContactItem } from "@/components/storefront/cards/ContactCard";
import { FooterLinks } from "@/components/storefront/footer/FooterLinks";
import { IconButton } from "@/components/storefront/buttons/IconButton";
import { ContactFormModal } from "@/features/contact/components/ContactFormModal";
import { useCustomerCompany } from "@/features/customers/hooks/use-customer-company";
import { getImageUrl } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";
import { Loader2 } from "lucide-react";

export function Footer() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [isSubscribed, setIsSubscribed] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = React.useState(false);

  const { data: company } = useCustomerCompany();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      toast.error("Invalid Email", "Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to subscribe. Please try again.");
      }

      setIsSubscribed(true);
      setEmail("");
      toast.success("Subscription is done!");

      setTimeout(() => {
        setIsSubscribed(false);
      }, 6000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to subscribe. Please try again.";
      toast.error("Subscription Error", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dynamic Contact Cards based on Company API
  const dynamicContacts: ContactItem[] = React.useMemo(() => {
    const phone = company?.phone?.trim();

    const formatPhoneDisplay = (
      rawPhone: string | null | undefined,
      defaultVal: string
    ): string => {
      const target = rawPhone?.trim() || defaultVal;
      if (!target) return "";

      const digits = target.replace(/\D/g, "");
      if (digits.length === 12 && digits.startsWith("91")) {
        return `+91 ${digits.slice(2)}`;
      }
      if (digits.length === 10) {
        return `+91 ${digits}`;
      }
      if (digits.length > 10 && digits.startsWith("91")) {
        return `+91 ${digits.slice(2)}`;
      }

      // Fallback for other international formats
      const match = target.match(/^(\+\d{1,3})\s*(.*)$/);
      if (match) {
        const countryCode = match[1];
        const numberPart = match[2].replace(/\s+/g, "");
        return numberPart ? `${countryCode} ${numberPart}` : countryCode;
      }

      return target;
    };

    // 1. Call
    const defaultCallVal = defaultContacts[0]?.value || "+91 9486150579";
    const callValue = formatPhoneDisplay(phone, defaultCallVal);
    const callDigits = (phone || defaultCallVal).replace(/\D/g, "");
    const cleanCallNumber = callDigits.length === 10 ? `91${callDigits}` : callDigits;
    const callLink = cleanCallNumber ? `tel:+${cleanCallNumber}` : "tel:+919486150579";

    // 2. WhatsApp (uses phonenumber field value as specified)
    const defaultWaVal = defaultContacts[1]?.value || "+91 9486150579";
    const waValue = formatPhoneDisplay(phone, defaultWaVal);
    const waDigits = (phone || defaultWaVal).replace(/\D/g, "");
    const cleanWaNumber = waDigits.length === 10 ? `91${waDigits}` : waDigits;
    const waLink = cleanWaNumber
      ? `https://wa.me/${cleanWaNumber}`
      : "https://wa.me/919486150579";

    // 3. Mail
    const companyEmail = company?.email?.trim();
    const mailValue =
      companyEmail || defaultContacts[2]?.value || "rithanyafoods@gmail.com";
    const mailLink = companyEmail
      ? `mailto:${companyEmail}`
      : defaultContacts[2]?.link || "mailto:rithanyafoods@gmail.com";

    return [
      {
        id: 1,
        icon: ICONS.call,
        title: "Call",
        value: callValue,
        link: callLink,
      },
      {
        id: 2,
        icon: ICONS.whatsapp,
        title: "WhatsApp",
        value: waValue,
        link: waLink,
      },
      {
        id: 3,
        icon: ICONS.mail,
        title: "Mail",
        value: mailValue,
        link: mailLink,
      },
    ];
  }, [company]);

  // Company Name
  const companyName =
    company?.companyName?.trim() || "Rithanya Food Products and Exports";

  // Company Logo
  const companyLogo = company?.logo ? getImageUrl(company.logo) : LOGOS.logo;

  // Formatted Location Address
  const formattedLocation = React.useMemo(() => {
    if (!company) {
      return "6/1033, Thillai Nagar Trichy Road, Namakkal - 637 002.";
    }

    const parts: string[] = [];
    if (company.address?.trim()) parts.push(company.address.trim());
    if (company.city?.trim()) parts.push(company.city.trim());

    const statePinParts: string[] = [];
    if (company.state?.trim()) statePinParts.push(company.state.trim());
    if (company.pincode?.trim()) statePinParts.push(company.pincode.trim());

    if (statePinParts.length > 0) {
      parts.push(statePinParts.join(" - "));
    }

    if (parts.length === 0) {
      return "6/1033, Thillai Nagar Trichy Road, Namakkal - 637 002.";
    }

    return parts.join(", ");
  }, [company]);

  const mapsUrl = React.useMemo(() => {
    if (!company?.address && !company?.city) {
      return "https://www.google.com/maps/place/RITHU'S+SNACKS/@11.1971509,78.1334803,13.77z/data=!4m6!3m5!1s0x3babcf3326ff1e47:0xafbe7c7cb1da0dd4!8m2!3d11.1995895!4d78.1815903!16s%2Fg%2F11vlt_cxvy?entry=ttu";
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formattedLocation)}`;
  }, [company, formattedLocation]);

  // Handle clicks on "Ready to Assist" links
  const handleReadyToAssistClick = (item: string) => {
    if (item === "Contact Us") {
      setIsContactModalOpen(true);
      return;
    }
    if (item === "Track My Order") {
      router.push("/orders");
      return;
    }
    if (item === "Terms & Condition" || item === "Terms & Conditions") {
      router.push("/terms-and-conditions");
      return;
    }
    if (item === "Privacy Policy") {
      router.push("/privacy-policy");
      return;
    }
    if (item === "Return & Refund Policy") {
      router.push("/return-refund-policy");
      return;
    }
    if (item === "FAQ's" || item === "FAQs" || item === "FAQ" || item === "Faq") {
      router.push("/faq");
      return;
    }
  };

  // Handle clicks on "Main Menu" links
  const handleMainMenuClick = (item: string) => {
    if (item === "Shop All") {
      router.push("/products");
      return;
    }
    if (item === "Our Snacks") {
      router.push("/categories");
      return;
    }
    if (item === "Festive Gifting") {
      router.push("/festive-gifting");
      return;
    }
    if (item === "Bulk Order") {
      router.push("/bulk-order");
      return;
    }
    if (item === "About Us") {
      router.push("/about");
      return;
    }
  };

  return (
    <footer className="relative pt-4">
      {/* Floating Contact Cards */}
      <div className="relative z-10 lg:translate-y-12 mb-6 lg:mb-0">
        <div className="grid md:grid-cols-3 gap-5 max-w-[1100px] mx-auto px-4">
          {dynamicContacts.map((contact) => (
            <ContactCard key={contact.id} contact={contact} />
          ))}
        </div>
      </div>

      {/* Main Brown Footer Area */}
      <div className="bg-[var(--brown-700)] min-h-[350px] pt-10 lg:pt-24 text-white">
        <div className="w-full max-w-[1400px] 2xl:max-w-[1600px] 3xl:max-w-[1800px] mx-auto px-6 lg:px-10">
          <div className="flex flex-col gap-10 lg:justify-between lg:flex-row">
            {/* Column 1: Ready to Assist */}
            <FooterLinks
              title="Ready to Assist"
              items={readyToAssist}
              onItemClick={handleReadyToAssistClick}
              className="mb-2"
            />

            {/* Column 2: Main Menu */}
            <FooterLinks
              title="Main Menu"
              items={mainMenu}
              onItemClick={handleMainMenuClick}
              className="mb-2"
            />

            {/* Column 3: Newsletter Sign Up */}
            <div>
              <h3 className="text-[24px] sm:text-[28px] lg:text-xl font-semibold mb-6">
                Sign Up and Save
              </h3>

              <p className="text-gray-200 header-font">
                Join Our Newsletter for Updates & Offers
              </p>

              {isSubscribed ? (
                <div className="mt-8 py-2.5 px-3 bg-amber-400/10 border border-amber-300/30 rounded-lg text-xs sm:text-sm text-amber-300 font-medium header-font flex items-center gap-2 animate-in fade-in duration-200">
                  <span>✓ Subscription is done! Thank you for subscribing.</span>
                </div>
              ) : (
                <form
                  onSubmit={handleSubscribe}
                  className="mt-8 border-b border-gray-300 flex items-center pb-3 header-font max-w-[300px] lg:max-w-none transition-colors duration-300 hover:border-white"
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    placeholder="Enter Your Email"
                    className="flex-1 bg-transparent outline-hidden text-white placeholder:text-gray-300 text-sm disabled:opacity-60"
                  />

                  {email.trim() ? (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-[var(--brown-600)] text-white px-4 py-1 rounded-md text-sm transition-all duration-300 hover:bg-[var(--brown-500)] cursor-pointer disabled:opacity-60 flex items-center gap-1.5 shrink-0"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <span>Submit</span>
                      )}
                    </button>
                  ) : (
                    <Image
                      src={ICONS.mail}
                      alt="mail"
                      width={20}
                      height={20}
                      className="invert transition-all duration-300"
                    />
                  )}
                </form>
              )}

              {/* Social Icons */}
              <div className="flex mt-7 gap-5">
                {footerSocialIcons.map((item) => {
                  const href =
                    item.name.toLowerCase() === "whatsapp"
                      ? dynamicContacts.find((c) => c.title.toLowerCase() === "whatsapp")?.link || item.link
                      : item.link;

                  return (
                    <IconButton
                      key={item.id}
                      icon={item.icon}
                      alt={item.name}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      imageClassName="w-[30px] h-[30px]"
                      className="hover:-translate-y-1"
                    />
                  );
                })}
              </div>
            </div>

            {/* Column 4: Brand Logo & Address */}
            <div className="mt-2 lg:mt-0 w-full lg:w-auto max-w-full sm:max-w-md lg:max-w-[320px] flex flex-col items-center">
              <div className="flex justify-center w-full">
                <Image
                  src={companyLogo}
                  alt={companyName}
                  width={90}
                  height={90}
                  className="transition-transform duration-300 hover:scale-105 object-contain"
                />
              </div>

              <h3 className="text-xl lg:text-2xl font-semibold mt-4 text-center w-full">
                {companyName}
              </h3>

              <div className="flex items-start justify-start gap-2.5 mt-4 text-left w-full">
                <Image
                  src={ICONS.location}
                  alt="location_icon"
                  width={22}
                  height={22}
                  className="shrink-0 mt-0.5 object-contain"
                />
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="header-font text-sm hover:underline text-gray-200 leading-relaxed break-words"
                >
                  {formattedLocation}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Separator Line */}
        <div className="mt-8 h-[3px] bg-[var(--brown-600)]" />

        {/* Copyright Bar */}
        <div className="flex flex-col gap-2 pt-5 pb-[calc(env(safe-area-inset-bottom)+5.5rem)] lg:pb-6 text-sm text-gray-200 header-font text-center lg:flex-row lg:justify-between lg:items-center lg:text-left px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
          <p className="header-font">
            Copyright © {new Date().getFullYear()} {companyName}. All Rights Reserved.
          </p>

          <p className="header-font">
            Design and Developed By{" "}
            <a
              href="https://proz.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block cursor-pointer select-none transition-all duration-200 hover:text-amber-300 hover:translate-x-1.5"
            >
              ProZ Solutions LLP
            </a>
            .
          </p>
        </div>
      </div>

      {/* Contact Form Modal */}
      <ContactFormModal
        open={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />
    </footer>
  );
}

export default Footer;

