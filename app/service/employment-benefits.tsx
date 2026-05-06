import { ServiceCategoryPage } from "@/components/common/ServiceCategoryPage";
import React from "react";
import { useTranslation } from "react-i18next";

export default function EmploymentBenefitsPage() {
  const { t } = useTranslation();

  return (
    <ServiceCategoryPage
      title={t("employmentBenefits")}
      subtitle="EPF, SOCSO & employment records"
      heroIcon="briefcase-outline"
      services={[
        { label: "EPF Contribution", icon: "wallet-outline" },
        { label: "SOCSO Claims", icon: "shield-half-outline" },
        { label: "Unemployment Benefits", icon: "people-outline" },
        { label: "Employee Information", icon: "person-circle-outline" },
      ]}
    />
  );
}
