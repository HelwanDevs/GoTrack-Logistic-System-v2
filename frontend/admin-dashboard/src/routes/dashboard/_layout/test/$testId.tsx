import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/_layout/test/$testId")({
  beforeLoad: async ({ params }) => {
    const { testId } = params;
    console.log("Loading test with ID:", testId);
  },
  component: () => (
    <>
      <div>
        <h1>Test Detail</h1>
      </div>
    </>
  ),
});
