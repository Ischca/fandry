import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";
import {
  AccordionSection,
  AIChatSection,
  AlertsSection,
  ButtonsSection,
  CalendarSection,
  CarouselSection,
  CollapsibleSection,
  ColorCombinationsSection,
  DataDisplaySection,
  FormInputsSection,
  LayoutSection,
  MenusSection,
  OverlaysSection,
  TabsSection,
  TextColorsSection,
  ToastSection,
  ToggleSection,
} from "./showcase";

export default function ComponentsShowcase() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container max-w-6xl mx-auto">
        <div className="space-y-2 justify-between flex">
          <h2 className="text-3xl font-bold tracking-tight mb-6">
            Shadcn/ui Component Library
          </h2>
          <Button variant="outline" size="icon" onClick={toggleTheme}>
            {theme === "light" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>
        </div>

        <div className="space-y-12">
          <TextColorsSection />
          <ColorCombinationsSection />
          <ButtonsSection />
          <FormInputsSection />
          <DataDisplaySection />
          <AlertsSection />
          <TabsSection />
          <AccordionSection />
          <CollapsibleSection />
          <OverlaysSection />
          <MenusSection />
          <CalendarSection />
          <CarouselSection />
          <ToggleSection />
          <LayoutSection />
          <ToastSection />
          <AIChatSection />
        </div>
      </main>

      <footer className="border-t py-6 mt-12">
        <div className="container text-center text-sm text-muted-foreground">
          <p>Shadcn/ui Component Showcase</p>
        </div>
      </footer>
    </div>
  );
}
