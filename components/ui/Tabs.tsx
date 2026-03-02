"use client";

import React from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface Tab {
    id: string;
    label: string;
    icon?: LucideIcon;
}

interface TabsProps {
    tabs: Tab[];
    activeTab: string;
    onChange: (tabId: string) => void;
}

export default function Tabs({ tabs, activeTab, onChange }: TabsProps) {
    return (
        <div className="relative flex border-b border-[#2A2A35]">
            {tabs.map((tab) => {
                const isActive = tab.id === activeTab;
                const Icon = tab.icon;

                return (
                    <button
                        key={tab.id}
                        onClick={() => onChange(tab.id)}
                        className={`
              relative flex items-center gap-2 px-4 py-3 text-sm font-medium
              transition-colors duration-200
              ${isActive ? "text-[#F0F0F5]" : "text-[#8B8B99] hover:text-[#F0F0F5]"}
            `}
                    >
                        {Icon && <Icon size={16} />}
                        {tab.label}

                        {isActive && (
                            <motion.div
                                layoutId="tab-underline"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7B5CF0]"
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                        )}
                    </button>
                );
            })}
        </div>
    );
}
