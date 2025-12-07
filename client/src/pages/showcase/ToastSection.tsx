import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast as sonnerToast } from "sonner";

export function ToastSection() {
  return (
    <section className="space-y-4">
      <h3 className="text-2xl font-semibold">Toast</h3>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label>Sonner Toast</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  sonnerToast.success("Operation successful", {
                    description: "Your changes have been saved",
                  });
                }}
              >
                Success
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  sonnerToast.error("Operation failed", {
                    description:
                      "Cannot complete operation, please try again",
                  });
                }}
              >
                Error
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  sonnerToast.info("Information", {
                    description: "This is an information message",
                  });
                }}
              >
                Info
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  sonnerToast.warning("Warning", {
                    description: "Please note the impact of this operation",
                  });
                }}
              >
                Warning
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  sonnerToast.loading("Loading", {
                    description: "Please wait",
                  });
                }}
              >
                Loading
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const promise = new Promise(resolve =>
                    setTimeout(resolve, 2000)
                  );
                  sonnerToast.promise(promise, {
                    loading: "Processing...",
                    success: "Processing complete!",
                    error: "Processing failed",
                  });
                }}
              >
                Promise
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
