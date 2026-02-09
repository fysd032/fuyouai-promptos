"use client";
import React from "react";
import { SiteFooter } from "./SiteFooter";

const LegalLayout: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#0B0F15_0%,#0F141C_40%,#111827_100%)] text-white font-sans">
      <main className="max-w-5xl mx-auto px-6 py-20">
        <h1 className="text-3xl sm:text-4xl font-semibold text-white">
          {title}
        </h1>
        <div className="mt-6 rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 text-sm text-slate-400">
          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export const PrivacyPolicy: React.FC = () => {
  return (
    <LegalLayout title="Privacy Policy">
      <div>
        <p>
          We value your privacy and are committed to handling your data in a
          transparent and responsible manner. This Privacy Policy explains how
          information is collected and used when you access or use our SaaS
          service.
        </p>
        <p>
          We collect limited personal information, including your email address
          and basic usage data (such as system interactions and feature usage).
          This data is collected solely to provide, operate, maintain, and
          improve the service, manage user accounts, and respond to support
          requests.
        </p>
        <p>
          We do not sell, rent, or share your personal data with third parties
          for commercial purposes. Your data is used only as necessary to
          deliver the service and comply with applicable legal obligations.
        </p>
        <p>
          You may contact us at any time if you have questions about this
          Privacy Policy or how your data is handled by emailing
          admin@fuyouai.com.
        </p>
      </div>
    </LegalLayout>
  );
};

export const TermsOfService: React.FC = () => {
  return (
    <LegalLayout title="Terms of Service">
      <div>
        <p>
          By accessing or using the <span className="">Fuyou AI</span> platform, you agree to these Terms
          of Service.
        </p>
        <p>
          <span className="">Fuyou AI</span> provides subscription-based access to AI-assisted system
          features through an online platform. An active subscription is
          required to access paid features. Subscriptions are billed monthly
          only, and annual plans are not offered.
        </p>
        <p>
          You agree to use the service in a lawful and reasonable manner and not
          to misuse, disrupt, or attempt unauthorized access to the system.
        </p>
        <p>
          The service is provided on an "as is" and "as available" basis. To the
          maximum extent permitted by law, <span className="">Fuyou AI</span> is not liable for any
          indirect, incidental, or consequential damages arising from the use of
          the service.
        </p>
        <p>
          We reserve the right to suspend or terminate access if these terms are
          violated or if required for legal or operational reasons. You may stop
          using the service at any time by discontinuing your subscription.
        </p>
        <p>For questions regarding these terms, please contact:</p>
        <p>admin@fuyouai.com</p>
      </div>
    </LegalLayout>
  );
};

export const RefundPolicy: React.FC = () => {
  return (
    <LegalLayout title="Refund Policy">
      <div>
        <p>
          <span className="">Fuyou AI</span> operates as a subscription-based SaaS platform.
        </p>
        <p>
          Subscription fees are billed in advance for the selected billing
          period on a monthly basis. Annual plans or custom yearly billing are
          not available.
        </p>
        <p>
          Because access to digital services and system resources is provided
          immediately upon purchase, payments are generally non-refundable.
        </p>
        <p>
          If you believe a billing error has occurred or experience technical
          issues preventing normal use of the service, you may contact us within
          7 days of the charge date.
        </p>
        <p>
          Refund requests are reviewed on a case-by-case basis in accordance
          with applicable consumer protection laws.
        </p>
        <p>Contact: admin@fuyouai.com</p>
      </div>
    </LegalLayout>
  );
};

export const AboutContact: React.FC = () => {
  return (
    <LegalLayout title="About & Contact">
      <div className="space-y-4">
        <p>
          <span className="">Fuyou AI</span> is an AI-powered SaaS platform designed to support structured task execution and system-level workflows.
          It provides users with access to standardized and professional system capabilities through a subscription-based model.
        </p>
        <p>
          The service is offered as a subscription-based software platform, with access levels and system capabilities defined by the selected plan.
        </p>
        <p>
          For inquiries or support, please contact us at: <span className="text-slate-200">admin@fuyouai.com</span>
        </p>
      </div>
    </LegalLayout>
  );
};

