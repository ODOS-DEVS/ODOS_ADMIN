import type { VendorApplication } from "@/types";
import { DetailField, DetailFields, DetailSection } from "@/components/ui/DetailList";
import { formatDateTime } from "@/utils/format";

function formatCoordinates(latitude?: number | null, longitude?: number | null) {
  if (latitude == null || longitude == null) {
    return "Not provided";
  }
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

function SocialLinkField({ label, value }: { label: string; value?: string | null }) {
  if (!value?.trim()) {
    return <DetailField label={label} value="Not provided" />;
  }

  return (
    <DetailField
      label={label}
      value={
        <a href={value} target="_blank" rel="noreferrer" className="break-all text-accent hover:underline">
          {value}
        </a>
      }
    />
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

  const assets = [
    { label: "Logo image", value: application.logoImageUrl },
    { label: "Banner image", value: application.bannerImageUrl },
    { label: "Shop image", value: application.shopImageUrl },
  ];

  return (
    <div className="max-h-[70vh] space-y-6 overflow-y-auto pr-1">
      <DetailSection title="Applicant account" description="ODOS user tied to this submission.">
        <DetailFields columns={2}>
          <DetailField label="Full name" value={application.fullName} />
          <DetailField label="Email" value={application.email} />
          <DetailField label="User ID" value={application.userId} />
          <DetailField label="Application status" value={application.status} />
        </DetailFields>
      </DetailSection>

      <DetailSection title="Business details">
        <DetailFields columns={2}>
          <DetailField label="Business name" value={application.businessName} />
          <DetailField label="Business category" value={application.businessCategory} />
          <DetailField
            label="Business registration number"
            value={application.businessRegistrationNumber ?? "Not provided"}
          />
          <DetailField label="Ghana card number" value={application.ghanaCardNumber ?? "Not provided"} />
          <DetailField
            label="Business description"
            value={application.businessDescription}
            className="sm:col-span-2"
          />
        </DetailFields>
      </DetailSection>

      <DetailSection title="Contact">
        <DetailFields>
          <DetailField label="Phone number" value={application.phoneNumber} />
        </DetailFields>
      </DetailSection>

      <DetailSection title="Store & location">
        <DetailFields columns={2}>
          <DetailField label="Store name" value={application.storeName} />
          <DetailField label="Market ID" value={application.marketId ?? "No market selected"} />
          <DetailField label="Region" value={application.region} />
          <DetailField label="City" value={application.city} />
          <DetailField label="Store address" value={application.storeLocation ?? "Not provided"} />
          <DetailField
            label="Coordinates"
            value={formatCoordinates(application.storeLatitude, application.storeLongitude)}
          />
          <DetailField
            label="Store description"
            value={application.storeDescription ?? "No store description added"}
            className="sm:col-span-2"
          />
        </DetailFields>
      </DetailSection>

      <DetailSection title="Social links">
        <DetailFields columns={2}>
          {socialLinks.map((entry) => (
            <SocialLinkField key={entry.label} label={entry.label} value={entry.value} />
          ))}
        </DetailFields>
      </DetailSection>

      <DetailSection title="Uploaded assets">
        <ul className="space-y-4">
          {assets.map((asset) => (
            <li key={asset.label}>
              <p className="text-xs text-textMuted">{asset.label}</p>
              {asset.value ? (
                <img src={asset.value} alt={asset.label} className="mt-2 max-h-40 rounded-lg object-cover" />
              ) : (
                <p className="mt-1 text-sm text-textMuted">No image uploaded</p>
              )}
            </li>
          ))}
        </ul>
      </DetailSection>

      <DetailSection title="Review timeline">
        <DetailFields columns={2}>
          <DetailField label="Submitted" value={formatDateTime(application.submittedAt)} />
          <DetailField label="Last updated" value={formatDateTime(application.updatedAt)} />
          <DetailField
            label="Reviewed"
            value={application.reviewedAt ? formatDateTime(application.reviewedAt) : "Not reviewed yet"}
          />
          <DetailField label="Rejection reason" value={application.rejectionReason ?? "Not rejected"} />
        </DetailFields>
      </DetailSection>
    </div>
  );
}
