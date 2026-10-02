// This is a demo of a preview
// That's what users will see in the preview

'use client';

import { FlowButton } from "@/components/ui/flow-button";

export const FlowButtonDemo = () => {
  return (
    <div className="flex min-h-[320px] w-full items-center justify-center rounded-2xl bg-gray-100 p-8 shadow-inner">
      <div className="flex flex-col items-center gap-4">
        <span className="text-xs font-mono uppercase tracking-widest text-neutral-400">Interactive Preview</span>
        <FlowButton text="Flow Button" />
      </div>
    </div>
  );
};

export default { FlowButtonDemo };
