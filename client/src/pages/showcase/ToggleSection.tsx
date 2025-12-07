import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export function ToggleSection() {
  return (
    <section className="space-y-4">
      <h3 className="text-2xl font-semibold">Toggle</h3>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label>Toggle</Label>
            <div className="flex gap-2">
              <Toggle aria-label="Toggle italic">
                <span className="font-bold">B</span>
              </Toggle>
              <Toggle aria-label="Toggle italic">
                <span className="italic">I</span>
              </Toggle>
              <Toggle aria-label="Toggle underline">
                <span className="underline">U</span>
              </Toggle>
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Toggle Group</Label>
            <ToggleGroup type="multiple">
              <ToggleGroupItem value="bold" aria-label="Toggle bold">
                <span className="font-bold">B</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="italic" aria-label="Toggle italic">
                <span className="italic">I</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="underline" aria-label="Toggle underline">
                <span className="underline">U</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
