import { useParams } from "@tanstack/react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faDna, faFaceSmile, faGem, faHandSparkles, faPalette, faScissors, faShirt } from "@fortawesome/free-solid-svg-icons";
import type { EditorMode } from "../../../../resource/common/nui";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../components/ui/tooltip";
import { useLang } from "../../lib/lang";
import { goToTab } from "./actions";
import { isTab, TABS, type Tab } from "./tabs";

export const TAB_INFO: Record<Tab, { icon: IconDefinition; label: string }> = {
  heritage: { icon: faDna, label: "UI_TAB_HERITAGE" },
  face: { icon: faFaceSmile, label: "UI_TAB_FACE" },
  hair: { icon: faScissors, label: "UI_TAB_HAIR" },
  skin: { icon: faHandSparkles, label: "UI_TAB_SKIN" },
  makeup: { icon: faPalette, label: "UI_TAB_MAKEUP" },
  clothing: { icon: faShirt, label: "UI_TAB_CLOTHING" },
  accessories: { icon: faGem, label: "UI_TAB_ACCESSORIES" },
};

/** The mode's tabs as the round category column; the open one comes from the router, hover shows its name. */
export function TabBar({ mode, className }: { mode: EditorMode; className?: string }) {
  const t = useLang();
  const { tab } = useParams({ strict: false });
  const tabs = TABS[mode];
  if (tabs.length < 2) return null;
  const active = isTab(tab) ? tabs.indexOf(tab) : -1;
  return (
    <Tabs className={className} orientation="vertical" value={isTab(tab) ? tab : undefined} onValueChange={(value) => isTab(value) && goToTab(value)}>
      <TabsList active={active}>
        {tabs.map((id) => (
          <Tooltip key={id}>
            <TooltipTrigger asChild>
              <TabsTrigger value={id} aria-label={t(TAB_INFO[id].label)}>
                <FontAwesomeIcon icon={TAB_INFO[id].icon} aria-hidden />
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent side="left">{t(TAB_INFO[id].label)}</TooltipContent>
          </Tooltip>
        ))}
      </TabsList>
    </Tabs>
  );
}
