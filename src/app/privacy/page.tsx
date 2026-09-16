import { PageHero } from "@/components/PageHero";

export const metadata = { title: "Privacy Policy" };

const sections = [
  {
    title: "Corporate Privacy Policy",
    body: `Renaatus Procon Private Limited (“Renaatus Procon”, “Company”, “we”, “us”, or “our”) is engaged in the business of manufacturing and supplying AAC blocks and related building materials. We are committed to protecting the privacy of individuals who interact with us, including customers, vendors, employees, channel partners, and website users. This Privacy Policy explains how we collect, use, store, share, and protect personal information in compliance with the Information Technology Act, 2000, the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011, and the Digital Personal Data Protection Act, 2023 (“Applicable Laws”). By visiting our website or otherwise providing personal information to us, you consent to the practices described in this Privacy Policy.`,
  },
  {
    title: "1. Information we collect",
    body: `A. Personal information: name, email, phone, postal address, company name, designation, KYC documents when required, customer interaction data (contact forms, price enquiries, quotation requests, WhatsApp chats, site visit requests, complaints), logistics and site-delivery details, and warranty/quality issue photos or notes.
B. Automatically collected: IP address, browser type, operating system, device information, pages visited, time spent, cookies.
C. Sensitive personal data: we do not intentionally collect Sensitive Personal Data under SPDI Rules. If collected for HR or legal purposes (financial information, PAN, Aadhaar, bank details), it will be used strictly for that purpose.`,
  },
  {
    title: "2. How we use your information",
    body: `Providing products and services; processing orders, dispatch, invoicing and logistics; managing dealer/partner/vendor relationships; internal record-keeping; website functionality; legal compliance; fraud prevention; and business communications. Personal information is processed only for lawful purposes.`,
  },
  {
    title: "3. Sharing of personal information",
    body: `We may share information with logistics partners, IT/CRM providers, auditors, consultants, regulatory authorities when required, group entities, and professional advisors. We do not sell or rent personal data for marketing purposes.`,
  },
  {
    title: "4. Data retention",
    body: `We retain personal information only as long as necessary for the purpose collected, or as required under Applicable Laws (including Companies Act, Income Tax Act, GST laws).`,
  },
  {
    title: "5. Security practices",
    body: `We implement administrative, technical and physical safeguards including password protection, access control, secure servers, firewalls and periodic security reviews, and comply with ISO/industry-standard practices where applicable.`,
  },
  {
    title: "6. Your rights",
    body: `Subject to Applicable Laws you may access personal information, request corrections, withdraw consent where processing is based on consent, request deletion where permissible, and raise grievances with the Grievance Officer.`,
  },
  {
    title: "7. Cookie policy",
    body: `Our website may use cookies to improve performance, recognize preferences and analyse traffic. You can control cookies through your browser; disabling them may affect functionality.`,
  },
  {
    title: "8. Links to external websites",
    body: `Third-party sites operate independently. Renaatus Procon is not responsible for their privacy practices or content.`,
  },
  {
    title: "9. Grievance Officer",
    body: `Name: Venkatesh Pakala. Designation: Grievance Officer. Email: coo@renacon.in. Office: Renaatus Procon Private Limited, No:156, Mullamparapu, N.G. Palayam, Erode, Tamil Nadu – 638115.`,
  },
  {
    title: "10. CERT-In point of contact",
    body: `Name: M. Saravanan. Designation: CERT-In Point of Contact. Email: headit@renacon.in. Phone: +91 9791891777.`,
  },
  {
    title: "11–12. Updates and contact",
    body: `We may update this policy to reflect legal or operational changes. Questions: headit@renacon.in · +91 9791891777 · Renaatus Procon Private Limited, No:156, Mullamparapu, N.G. Palayam, Erode, Tamil Nadu – 638115.`,
  },
];

export default function PrivacyPage() {
  return (
    <>
      <PageHero title="Privacy policy" />
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-14 text-slate-700">
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="text-xl font-semibold text-slate-900">{s.title}</h2>
            <p className="mt-3 whitespace-pre-line leading-7">{s.body}</p>
          </section>
        ))}
      </div>
    </>
  );
}
