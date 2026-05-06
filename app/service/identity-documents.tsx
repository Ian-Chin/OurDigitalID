import { ServiceCategoryPage } from "@/components/common/ServiceCategoryPage";
import React from "react";
import { useTranslation } from "react-i18next";

export default function IdentityDocumentsPage() {
  const { t } = useTranslation();

  return (
    <ServiceCategoryPage
      title={t("identityDocuments")}
      subtitle="MyKad, passports & civil records"
      heroIcon="card-outline"
      services={[
        { label: "Renew MyKad", icon: "card-outline" },
        { label: "Birth Certificate Application", icon: "document-text-outline" },
        { label: "Passport Application", icon: "airplane-outline" },
        { label: "Passport Renewal", icon: "refresh-circle-outline" },
      ]}
    />
  );
}
