import { createFileRoute } from "@tanstack/react-router";
import { ProfileDetailPage } from "@/pages/ProfileDetailPage";

export const Route = createFileRoute("/dashboard/_layout/profile/$profileId")({
  beforeLoad: async ({ params }) => {
    const { profileId } = params;
    console.log("Loading profile with ID:", profileId);
  },
  component: ProfileDetailPage,
});
