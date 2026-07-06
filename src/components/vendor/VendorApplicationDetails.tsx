import type { ReactNode } from "react";
import type { VendorApplication } from "@/types";
import { formatDateTime } from "@/utils/format";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-textMuted">{label}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm text-textStrong">{value}</p>
    </div>
  );
}

function DetailSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-textStrong">{title}</h3>
        {description ? <p className="mt-1 text-xs text-textMuted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function formatCoordinates(latitude?: number | null, longitude?: number | null) {
  if (latitude == null || longitude == null) {
    return "Not provided";
  }
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

function SocialLinkRow({ label, value }: { label: string; value?: string | null }) {
  if (!value?.trim()) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-textMuted">
        <span>{label}</span>
        <span>Not provided</span>
      </div>
    );
  }

  return (
    <a
      href={value}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-sky-300 transition hover:border-sky-400/30 hover:bg-sky-500/10"
    >
      <span>{label}</span>
      <span className="truncate">{value}</span>
    </a>
  );
}

export function VendorApplicationDetails({ application }: { application: VendorApplication }) {
  const socialLinks = [
    { label: "Instagram", value: application.storeInstagramUrl },
    { label: "Facebook", value: application.storeFacebookUrl },
    { label: "TikTok", value: application.storeTiktokUrl },
    { label: "X / Twitter", value: application.storeTwitterUrl },
    { label: "Website", value: application.storeWebsiteUrl },
  ];

  return (
    <div className="max-h-[70vh] space-y-8 overflow-y-auto pr-1">
      <DetailSection title="Applicant account" description="ODOS user tied to this submission.">
        <div className="grid gap-4 md:grid-cols-2">
          <DetailRow label="Full name" value={application.fullName} />
          <DetailRow label="Email" value={application.email} />
          <DetailRow label="User ID" value={application.userId} />
          <DetailRow label="Application status" value={application.status} />
        </div>
      </DetailSection>

      <DetailSection title="Business details">
        <div className="grid gap-4 md:grid-cols-2">
          <DetailRow label="Business name" value={application.businessName} />
          <DetailRow label="Business category" value={application.businessCategory} />
          <DetailRow
            label="Business registration number"
            value={application.businessRegistrationNumber ?? "Not provided"}
          />
          <DetailRow
            label="Ghana card number"
            value={application.ghanaCardNumber ?? "Not provided"}
          />
        </div>
        <DetailRow label="Business description" value={application.businessDescription} />
      </DetailSection>

      <DetailSection title="Contact">
        <div className="grid gap-4 md:grid-cols-2">
          <DetailRow label="Phone number" value={application.phoneNumber} />
        </div>
      </DetailSection>

      <DetailSection title="Store & location">
        <div className="grid gap-4 md:grid-cols-2">
          <DetailRow label="Store name" value={application.storeName} />
          <DetailRow label="Market ID" value={application.marketId ?? "No market selected"} />
          <DetailRow label="Region" value={application.region} />
          <DetailRow label="City" value={application.city} />
          <DetailRow
            label="Store address"
            value={application.storeLocation ?? "Not provided"}
          />
          <DetailRow
            label="Coordinates"
            value={formatCoordinates(application.storeLatitude, application.storeLongitude)}
          />
        </div>
        <DetailRow
          label="Store description"
          value={application.storeDescription ?? "No store description added"}
        />
      </DetailSection>

      <DetailSection title="Social links">
        <div className="space-y-2">
          {socialLinks.map((entry) => (
            <SocialLinkRow key={entry.label} label={entry.label} value={entry.value} />
          ))}
        </div>
      </DetailSection>

      <DetailSection title="Uploaded assets">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Logo image", value: application.logoImageUrl },
            { label: "Banner image", value: application.bannerImageUrl },
            { label: "Shop image", value: application.shopImageUrl },
          ].map((asset) => (
            <div
              key={asset.label}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-3"
            >
              <p className="mb-3 text-xs uppercase tracking-[0.2em] text-textMuted">
                {asset.label}
              </p>
              {asset.value ? (
                <img
                  src={asset.value}
                  alt={asset.label}
                  className="h-40 w-full rounded-2xl object-cover"
                />
              ) : (
                <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-950/20 text-sm text-textMuted">
                  No image uploaded
                </div>
              )}
            </div>
          ))}
        </div>
      </DetailSection>

      <DetailSection title="Review timeline">
        <div className="grid gap-4 md:grid-cols-2">
          <DetailRow label="Submitted" value={formatDateTime(application.submittedAt)} />
          <DetailRow
            label="Last updated"
            value={formatDateTime(application.updatedAt)}
          />
          <DetailRow
            label="Reviewed"
            value={application.reviewedAt ? formatDateTime(application.reviewedAt) : "Not reviewed yet"}
          />
          <DetailRow
            label="Rejection reason"
            value={application.rejectionReason ?? "Not rejected"}
          />
        </div>
      </DetailSection>
    </div>
  );
}
