import React from "react";

export type HowToStep = {
  step: string;
  title: string;
  desc: string;
};

export type FaqItem = {
  q: string;
  a: string;
};

// Generic How-To Grid
export function HowToGridSection({
  heading,
  steps,
}: {
  heading: string;
  steps: HowToStep[];
}) {
  return (
    <section className="mb-16">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{heading}</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((item, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm mb-1">
              {item.step}
            </div>
            <h3 className="font-semibold text-gray-900">{item.title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// Generic FAQ List
export function FaqListSection({
  heading,
  faqs,
}: {
  heading: string;
  faqs: FaqItem[];
}) {
  return (
    <section className="mb-16">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{heading}</h2>
      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <div key={i} className="border-b border-gray-100 pb-4 last:border-0">
            <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}