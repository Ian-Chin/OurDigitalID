import { ServiceCategoryPage } from "@/components/common/ServiceCategoryPage";
import React from "react";
import { useTranslation } from "react-i18next";

export default function HealthcarePage() {
  const { t } = useTranslation();

  return (
    <ServiceCategoryPage
      title={t("healthcare")}
      subtitle="Clinic visits, vaccinations & prescriptions"
      heroIcon="medkit-outline"
      services={[
        { label: t("healthcare"), icon: "fitness-outline" },
        { label: "Health Check-up", icon: "pulse-outline" },
        { label: "Vaccination Appointment", icon: "shield-checkmark-outline" },
        { label: "Prescription Refill", icon: "medical-outline" },
      ]}
    />
  );
}
