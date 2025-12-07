import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export function LayoutSection() {
  return (
    <>
      <section className="space-y-4">
        <h3 className="text-2xl font-semibold">Layout Components</h3>
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <Label>Aspect Ratio (16/9)</Label>
              <AspectRatio ratio={16 / 9} className="bg-muted">
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">16:9 Aspect Ratio</p>
                </div>
              </AspectRatio>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Scroll Area</Label>
              <ScrollArea className="h-[200px] w-full rounded-md border overflow-hidden">
                <div className="p-4">
                  <div className="space-y-4">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div key={i} className="text-sm">
                        Item {i + 1}: This is a scrollable content area
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h3 className="text-2xl font-semibold">Resizable Panels</h3>
        <Card>
          <CardContent className="pt-6">
            <ResizablePanelGroup
              direction="horizontal"
              className="min-h-[200px] rounded-lg border"
            >
              <ResizablePanel defaultSize={50}>
                <div className="flex h-full items-center justify-center p-6">
                  <span className="font-semibold">Panel One</span>
                </div>
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel defaultSize={50}>
                <div className="flex h-full items-center justify-center p-6">
                  <span className="font-semibold">Panel Two</span>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
