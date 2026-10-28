import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Info } from 'lucide-react';

interface StaticPageProps {
  title: string;
  badge?: string;
  children: React.ReactNode;
}

function StaticPage({ title, badge = 'Information', children }: StaticPageProps) {
  return (
    <div className="container-page py-10 sm:py-14 max-w-3xl">
      <Badge tone="neutral" className="mb-3"><Info className="h-3 w-3" /> {badge}</Badge>
      <h1 className="font-display text-3xl font-bold text-ink-950">{title}</h1>
      <Card className="mt-6 p-6 sm:p-8 prose-doc max-w-none">{children}</Card>
    </div>
  );
}

export function AboutPage() {
  return (
    <StaticPage title="About SAZU Study Hub" badge="About">
      <p>SAZU Study Hub helps students discover learning materials organized around their academic programmes and courses.</p>
      <h3>What you can do</h3>
      <ul>
        <li>Browse available learning materials and their course details.</li>
        <li>Create an account and submit academic details for verification.</li>
        <li>View available subscription packages and payment history.</li>
      </ul>
      <h3>Materials and availability</h3>
      <p>Materials are made available as they are added to the platform. Check each resource's details and access requirements before downloading.</p>
      <h3>Institutional information</h3>
      <p>SAZU Study Hub is an independent learning resource platform and is not an official service of Sa'adu Zungur University.</p>
    </StaticPage>
  );
}

export function HelpPage() {
  return (
    <StaticPage title="Help & Support" badge="Help">
      <h3>Accounts</h3>
      <ul>
        <li><strong>Can I browse without an account?</strong> Public resource listings can be browsed without signing in. Some actions require an account.</li>
        <li><strong>I cannot sign in.</strong> Check that you entered the email and password used to register. Password recovery is not currently available in the account interface.</li>
        <li><strong>Why can't I access a resource?</strong> Access is determined by the resource's availability and the account requirements shown by the platform.</li>
      </ul>
      <h3>Payments</h3>
      <p>Available packages and payment status are shown in your account. Complete payment only through the checkout opened by the platform, and contact your platform administrator if a payment status does not update.</p>
      <h3>Getting support</h3>
      <p>For account, verification, resource, or payment assistance, contact the SAZU Study Hub administrator through the support channel provided to you.</p>
    </StaticPage>
  );
}

export function PrivacyPage() {
  return (
    <StaticPage title="Privacy Policy" badge="Privacy">
      <p>This page describes the personal information handled by the current SAZU Study Hub experience.</p>
      <h3>Information you provide</h3>
      <p>When you register or submit academic verification details, the information you enter is sent to the platform backend to support your account and verification request.</p>
      <h3>Account session</h3>
      <p>Your sign-in token is stored in your browser so you can remain signed in. Signing out removes that token from the browser.</p>
      <h3>Payments</h3>
      <p>When checkout is available, payment processing is provided through the configured payment provider. The platform uses payment status and transaction details returned by that provider to update your account history.</p>
      <h3>Questions about your information</h3>
      <p>Contact the SAZU Study Hub administrator through the support channel provided to you for questions or requests concerning your account information.</p>
    </StaticPage>
  );
}

export function TermsPage() {
  return (
    <StaticPage title="Terms of Service" badge="Terms">
      <p>By using SAZU Study Hub, you agree to use the service lawfully and to provide accurate information when creating an account or requesting academic verification.</p>
      <h3>Accounts and academic information</h3>
      <ul>
        <li>Keep your account credentials private and notify the platform administrator if you believe your account has been accessed without permission.</li>
        <li>Submit only academic information that belongs to you and that you are authorized to provide.</li>
        <li>Verification decisions and access to individual resources are subject to platform review and the requirements displayed for each resource.</li>
      </ul>
      <h3>Materials and subscriptions</h3>
      <p>Resource availability, package details, and access conditions may vary. Review the information shown before purchasing a package or downloading a resource. Do not redistribute materials unless you have permission to do so.</p>
      <h3>Payments</h3>
      <p>Payments are handled through the payment provider presented during checkout. A subscription or access entitlement is applied only after the backend confirms the transaction.</p>
      <h3>Changes and assistance</h3>
      <p>Service features and resource availability may change. Contact the SAZU Study Hub administrator through the support channel provided to you with questions about these terms or your account.</p>
    </StaticPage>
  );
}
