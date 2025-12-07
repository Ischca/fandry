import { Card, CardContent } from "@/components/ui/card";

export function TextColorsSection() {
  return (
    <section className="space-y-4">
      <h3 className="text-2xl font-semibold">Text Colors</h3>
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Foreground (Default)
                </p>
                <p className="text-foreground text-lg">
                  Default text color for main content
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Muted Foreground
                </p>
                <p className="text-muted-foreground text-lg">
                  Muted text for secondary information
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Primary</p>
                <p className="text-primary text-lg font-medium">
                  Primary brand color text
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Secondary Foreground
                </p>
                <p className="text-secondary-foreground text-lg">
                  Secondary action text color
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Accent Foreground
                </p>
                <p className="text-accent-foreground text-lg">
                  Accent text for emphasis
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Destructive
                </p>
                <p className="text-destructive text-lg font-medium">
                  Error or destructive action text
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Card Foreground
                </p>
                <p className="text-card-foreground text-lg">
                  Text color on card backgrounds
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Popover Foreground
                </p>
                <p className="text-popover-foreground text-lg">
                  Text color in popovers
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
