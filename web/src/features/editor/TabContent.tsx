import type { ReactNode } from "react"
import { useParams } from "@tanstack/react-router"
import { motion } from "motion/react"
import { AccessoriesTab, ClothingTab } from "./tabs/Clothing"
import { FaceTab, MakeupTab, SkinTab } from "./tabs/Face"
import { HairTab } from "./tabs/Hair"
import { HeritageTab } from "./tabs/Heritage"
import { isTab, type Tab } from "./tabs"

const BODIES: Record<Tab, () => ReactNode> = {
  heritage: () => <HeritageTab />,
  face: () => <FaceTab />,
  hair: () => <HairTab />,
  skin: () => <SkinTab />,
  makeup: () => <MakeupTab />,
  clothing: () => <ClothingTab />,
  accessories: () => <AccessoriesTab />,
}

/** The open tab's controls (route `/$tab`); a tab change is a short crossfade, nothing slides. */
export function TabContent() {
  const { tab } = useParams({ strict: false })
  if (!isTab(tab)) return null
  return (
    <motion.div
      key={tab}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="flex flex-col gap-[2vh] pr-[1.6vh] pb-[1vh]"
    >
      {BODIES[tab]()}
    </motion.div>
  )
}
